import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting E2E SQLite Metrics Sync test...');
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Enable console logs forwarding
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    // 1. Navigate to the App
    console.log('Navigating to http://localhost:4173 ...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });

    // Clear all storage to ensure we start at login page
    console.log('Clearing browser storage for a clean test run...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.name = '';
    });
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });

    // 2. Click 'Register' link to switch to registration form
    console.log('Switching to registration form...');
    await page.waitForSelector('.auth-link-text');
    await page.click('.auth-link-text');

    // Fill registration info
    const testUser = `sync_user_${Date.now()}`;
    const testEmail = `${testUser}@example.com`;
    const testPass = 'password123';
    
    console.log(`Registering new user: ${testUser} (${testEmail})...`);
    await page.waitForSelector('input[placeholder="Username"]');
    await page.type('input[placeholder="Username"]', testUser);
    await page.type('input[placeholder="Email Address"]', testEmail);
    await page.type('input[placeholder="Password"]', testPass);
    await page.type('input[placeholder="Confirm Password"]', testPass);
    
    // Click register
    await page.click('button[type="submit"]');

    // 3. Verify Dashboard loads for the new user
    console.log('Waiting for Dashboard...');
    await page.waitForSelector('.dashboard-container');
    let welcomeText = await page.$eval('.dashboard-welcome', el => el.textContent);
    if (!welcomeText.includes(testUser)) throw new Error('Dashboard did not greet the new user!');
    console.log('✅ Registered and logged in successfully!');

    // 4. Verify initial progress is 0%
    let progressVal = await page.$eval('.stat-value', el => el.textContent);
    if (progressVal !== '0%') throw new Error(`Expected initial progress to be 0%, got: ${progressVal}`);
    console.log('✅ Initial progress is 0%');

    // 5. Navigate to OS subject
    console.log('Navigating to OS Subject...');
    await page.waitForSelector('.subject-card.os');
    await page.click('.subject-card.os button.btn-primary');
    await page.waitForSelector('.subject-viewer-layout');

    // 6. Bookmark the topic
    console.log('Bookmarking active topic...');
    await page.waitForSelector('.bookmark-toggle-btn');
    let bookmarkBtnText = await page.$eval('.bookmark-toggle-btn', el => el.textContent);
    if (!bookmarkBtnText.includes('Bookmark Topic')) throw new Error('Expected bookmark button to be in un-bookmarked state');
    await page.click('.bookmark-toggle-btn');
    await page.waitForFunction(() => document.querySelector('.bookmark-toggle-btn').classList.contains('bookmarked'));
    console.log('✅ Topic bookmarked successfully!');

    // 7. Mark topic as completed
    console.log('Marking topic as completed...');
    await page.waitForSelector('.btn-primary');
    let completeBtn = null;
    const buttons = await page.$$('.reader-container button');
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Mark as Completed')) {
        completeBtn = btn;
        break;
      }
    }
    if (!completeBtn) throw new Error('Mark as Completed button not found');
    console.log('Button text before click:', await page.evaluate(el => el.textContent, completeBtn));
    await completeBtn.click();
    console.log('Clicked button. Waiting for button text to update...');
    await page.waitForFunction(() => {
      const btn = Array.from(document.querySelectorAll('.reader-container button')).find(b => b.textContent.includes('Completed'));
      return !!btn;
    });
    console.log('✅ Topic marked as completed successfully!');

    // 8. Reload the page to test persistence of session & metrics in SQLite
    console.log('Reloading page to verify persistence...');
    await page.reload({ waitUntil: 'networkidle0' });

    // Verify session remained active
    await page.waitForSelector('.subject-viewer-layout');
    console.log('✅ User session active after reload!');

    // Verify bookmark is still bookmarked
    const isBookmarked = await page.$eval('.bookmark-toggle-btn', el => el.classList.contains('bookmarked'));
    if (!isBookmarked) throw new Error('Bookmark was lost after page reload!');
    console.log('✅ Bookmark persisted after reload!');

    // Verify completion status persisted
    const isCompleted = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.reader-container button')).find(b => b.textContent.includes('Completed'));
      return !!btn;
    });
    if (!isCompleted) throw new Error('Completion status was lost after page reload!');
    console.log('✅ Completion status persisted after reload!');

    // 9. Go back to Dashboard and verify stats
    console.log('Navigating back to Dashboard...');
    await page.evaluate(() => {
      const el = document.querySelector('.navbar-brand');
      if (el) el.click();
    });
    await page.waitForSelector('.dashboard-container');

    // Verify metrics show updated status
    const newProgressVal = await page.$eval('.stat-value', el => el.textContent);
    if (newProgressVal === '0%') throw new Error('Progress metric did not update on the dashboard');
    console.log(`✅ Dashboard shows updated progress of ${newProgressVal}!`);

    // Verify Saved Bookmarks section exists and shows the bookmarked item
    await page.waitForSelector('.bookmark-card');
    console.log('✅ Saved Bookmarks card exists on dashboard!');

    // 10. Log out and verify metrics are cleared
    console.log('Logging out...');
    await page.click('.profile-dropdown-trigger');
    await page.waitForSelector('.dropdown-item');
    const dropdownItems = await page.$$('.dropdown-item');
    let logoutBtn = null;
    for (let item of dropdownItems) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text.includes('Sign Out')) {
        logoutBtn = item;
        break;
      }
    }
    if (!logoutBtn) throw new Error('Logout button not found in profile dropdown');
    await logoutBtn.click();
    await page.waitForSelector('.auth-card');
    console.log('✅ Logged out successfully!');

    // 11. Log back in and verify that SQLite restores the state
    console.log(`Logging back in as ${testUser}...`);
    // Tab should be Login
    await page.type('input[placeholder="Username or Email"]', testUser);
    await page.type('input[placeholder="Password"]', testPass);
    await page.click('button[type="submit"]');

    // Verify metrics restored
    await page.waitForSelector('.dashboard-container');
    const restoredProgressVal = await page.$eval('.stat-value', el => el.textContent);
    if (restoredProgressVal === '0%') throw new Error('Progress was not restored from SQLite after logging back in!');
    console.log(`✅ Progress restored successfully from SQLite: ${restoredProgressVal}`);

    await page.waitForSelector('.bookmark-card');
    console.log('✅ Bookmark restored successfully from SQLite!');

    // 12. Log out and log in as 'admin' to verify user isolation
    console.log('Logging out to test user isolation...');
    await page.click('.profile-dropdown-trigger');
    await page.waitForSelector('.dropdown-item');
    const dropdownItems2 = await page.$$('.dropdown-item');
    let logoutBtn2 = null;
    for (let item of dropdownItems2) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text.includes('Sign Out')) {
        logoutBtn2 = item;
        break;
      }
    }
    await logoutBtn2.click();
    await page.waitForSelector('.auth-card');

    console.log('Logging in as admin...');
    await page.type('input[placeholder="Username or Email"]', 'admin');
    await page.type('input[placeholder="Password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.dashboard-container');

    // Admin should have 0% progress and no bookmarks
    const adminProgress = await page.$eval('.stat-value', el => el.textContent);
    const hasAdminBookmark = await page.evaluate(() => !!document.querySelector('.bookmark-card'));
    if (adminProgress !== '0%') throw new Error(`Expected admin progress to be isolated (0%), got: ${adminProgress}`);
    if (hasAdminBookmark) throw new Error('Expected admin bookmarks to be isolated, but found active bookmark cards');
    console.log('✅ User isolation verified successfully! Admin metrics are completely isolated.');

    console.log('🎉 SQLite Metrics Sync E2E Verification Passed Perfectly!');

  } catch (err) {
    console.error('❌ E2E SQLite Metrics Sync Verification Failed:', err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
