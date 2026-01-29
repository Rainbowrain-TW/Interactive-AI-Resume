import { expect, test } from '@playwright/test';

const API_URL =
    'https://script.google.com/macros/s/AKfycbxtiajVpb8kqLr-iKmWnVa1_BJtgwiEUDbPAHrvllhKkGb8U2Obsx_lZKSvI8iB-wSI/exec';

const getStorageValue = async (page, key: string, type: 'local' | 'session') => {
    return page.evaluate(
        ({ key, type }) => {
            const storage = type === 'local' ? localStorage : sessionStorage;
            return storage.getItem(key);
        },
        { key, type }
    );
};

const CID_KEY = 'interactive-ai-resume-cid';
const SID_KEY = 'interactive-ai-resume-sid';
const PREVIOUS_RESPONSE_KEY = 'interactive-ai-resume-previous-response-id';

test('stores cid/sid, persists sid on reload, new tab gets new sid', async ({ page, context }) => {
    await page.goto('/');

    const cid = await getStorageValue(page, CID_KEY, 'local');
    const sid = await getStorageValue(page, SID_KEY, 'session');

    expect(cid).toBeTruthy();
    expect(sid).toBeTruthy();

    await page.reload();

    const cidAfterReload = await getStorageValue(page, CID_KEY, 'local');
    const sidAfterReload = await getStorageValue(page, SID_KEY, 'session');

    expect(cidAfterReload).toBe(cid);
    expect(sidAfterReload).toBe(sid);

    const newPage = await context.newPage();
    await newPage.goto('/');

    const cidNewTab = await getStorageValue(newPage, CID_KEY, 'local');
    const sidNewTab = await getStorageValue(newPage, SID_KEY, 'session');

    expect(cidNewTab).toBe(cid);
    expect(sidNewTab).toBeTruthy();
    expect(sidNewTab).not.toBe(sid);
});

test('shift+enter inserts newline and enter sends message', async ({ page }) => {
    await page.route(API_URL, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'completed',
                id: 'resp_shift_enter',
                text: '收到訊息'
            })
        });
    });

    await page.goto('/');
    const input = page.getByLabel('聊天輸入');

    await input.click();
    await page.keyboard.type('第一行');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('第二行');

    await expect(input).toHaveValue('第一行\n第二行');

    await page.keyboard.press('Enter');
    await expect(page.getByText('第一行')).toBeVisible();
    await expect(page.getByText('收到訊息')).toBeVisible();
});

test('sends payload and updates previous_response_id for multi-turn', async ({ page }) => {
    const payloads: Array<Record<string, unknown>> = [];
    const responses = [
        { status: 'completed', id: 'resp_first', text: '第一則回覆' },
        { status: 'completed', id: 'resp_second', text: '第二則回覆' }
    ];

    await page.route(API_URL, async (route) => {
        const request = route.request();
        const data = request.postDataJSON();
        payloads.push(data as Record<string, unknown>);

        const response = responses[payloads.length - 1] ?? responses[0];
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response)
        });
    });

    await page.goto('/');
    const input = page.getByLabel('聊天輸入');

    await input.fill('第一個問題');
    await page.keyboard.press('Enter');
    await expect(page.getByText('第一則回覆')).toBeVisible();

    await input.fill('第二個問題');
    await page.keyboard.press('Enter');
    await expect(page.getByText('第二則回覆')).toBeVisible();

    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toMatchObject({
        actionType: 'text',
        actionTarget: 'none',
        actionMessage: '第一個問題',
        previous_response_id: 'none'
    });

    expect(payloads[0].cid).toBeTruthy();
    expect(payloads[0].sid).toBeTruthy();

    expect(payloads[1]).toMatchObject({
        actionType: 'text',
        actionTarget: 'none',
        actionMessage: '第二個問題',
        previous_response_id: 'resp_first'
    });

    const previousResponseId = await getStorageValue(page, PREVIOUS_RESPONSE_KEY, 'session');
    expect(previousResponseId).toBe('resp_second');
});
