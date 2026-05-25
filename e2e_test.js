import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting end-to-end headless test...');
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // 1. Navigate to the App (Production Preview on port 4173)
    console.log('Navigating to http://localhost:4173 ...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });

    // 2. Perform Login
    console.log('Typing credentials...');
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'admin');
    
    console.log('Clicking Sign In...');
    await page.click('button[type="submit"]');

    // 3. Verify Dashboard
    console.log('Waiting for Dashboard to load...');
    await page.waitForSelector('.dashboard-container');
    const welcomeText = await page.$eval('.dashboard-welcome', el => el.textContent);
    if (!welcomeText.includes('admin')) throw new Error('Dashboard welcome text did not contain "admin"');
    console.log('✅ Dashboard loaded successfully!');

    // 4. Navigate to OS Subject
    console.log('Clicking on the first Subject Card (OS)...');
    await page.waitForSelector('.subject-card.os');
    await page.click('.subject-card.os button.btn-primary');

    // 5. Verify Reader and Sidebar layout
    console.log('Waiting for Reader Layout...');
    await page.waitForSelector('.subject-viewer-layout');
    await page.waitForSelector('.sidebar-container');
    console.log('✅ Subject page loaded!');

    // 6. Test Sidebar Collapse Fix
    console.log('Collapsing the sidebar...');
    // The button has title="Collapse Sidebar"
    await page.waitForSelector('button[title="Collapse Sidebar"]');
    await page.click('button[title="Collapse Sidebar"]');

    // Verify it collapsed
    await page.waitForSelector('.sidebar-container.collapsed');
    console.log('✅ Sidebar collapsed successfully!');

    // 7. Verify and Click the new floating Trigger Button to Expand
    console.log('Looking for the new floating expand trigger button...');
    await page.waitForSelector('.sidebar-toggle-trigger');
    const isVisible = await page.$eval('.sidebar-toggle-trigger', el => getComputedStyle(el).display !== 'none');
    if (!isVisible) throw new Error('Sidebar toggle trigger is hidden when it should be visible!');
    
    console.log('Clicking floating trigger to expand sidebar...');
    await page.click('.sidebar-toggle-trigger');

    // 8. Verify the sidebar is un-collapsed
    console.log('Verifying sidebar expanded...');
    await page.waitForFunction(() => !document.querySelector('.sidebar-container').classList.contains('collapsed'));
    console.log('✅ Sidebar expanded successfully via trigger!');

    // 9. Verify Quiz Widget renders
    console.log('Checking if Quiz Widget exists...');
    await page.waitForSelector('.quiz-widget');
    console.log('✅ Quiz widget loaded!');

    console.log('🎉 All End-to-End UI tests passed flawlessly!');

  } catch (error) {
    console.error('❌ E2E Test Failed:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
