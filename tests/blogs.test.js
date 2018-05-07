const Page = require('./helpers/page');

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000');
});

afterEach(async () => {
    await page.close();
});

describe('When logged in', async () => {
    beforeEach(async () => {
        await page.login();
        await page.click('a[href="/blogs/new"]');
    });

    test('Can see blog create form', async () => {
        const label = await page.getContentsOf('div.title > label');
        expect(label).toEqual('Blog Title');
    });

    describe('and using invalid inputs', async () => {
        beforeEach(async () => {
            await page.click('form button.teal');
        });

        test('the form shows an error message', async () => {
            const title = await page.getContentsOf('div.title div.red-text');
            const content = await page.getContentsOf('div.content div.red-text');

            expect(title).toEqual('You must provide a value');
            expect(content).toEqual('You must provide a value');
        });
    });

    describe('and using valid inputs', async () => {
        beforeEach(async () => {
            await page.type('.title input', 'Test Title');
            await page.type('.content input', 'Test Content');
            await page.click('form button.teal');
        });

        test('Submitting takes user to review screen', async () => {
            const text = await page.getContentsOf('form h5');
            expect(text).toEqual('Please confirm your entries');
        });

        test('Submitting then saving adds blog to index page', async () => {
            await page.click('form button.green');
            await page.waitFor('div.card');

            const title = await page.getContentsOf('.card-title');
            const content = await page.getContentsOf('p');

            expect(title).toEqual('Test Title');
            expect(content).toEqual('Test Content');
        });
    });

});

describe('When not logged in', async () => {
    
    const actions = [
        {
            method: 'get',
            path: '/api/blogs'
        },
        {
            method: 'post',
            path: '/api/blogs',
            data: {
                title: 'T',
                content: 'C'
            }
        }
    ];

    test('Blog related actions are prohibited', async () => {
        const results = await page.execRequests(actions);

        for (let result of results) {
            expect(result).toEqual({ error: 'You must log in!' })
        }
    })

    // test('Cannot create blog posts', async () => {

    //     const result = await page.post('/api/blogs', { title: 'T', content: 'C' });

    //     expect(result).toEqual({ error: 'You must log in!' });

    // });

    // test('Cannot get a list of posts', async () => {

    //     const result = await page.get('/api/blogs');

    //     expect(result).toEqual({ error: 'You must log in!' });

    // });
});