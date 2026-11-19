import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: '320px', width: 320, height: 640 },
  { name: '375px', width: 375, height: 812 },
  { name: '390px', width: 390, height: 844 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 768 },
  { name: '1440px', width: 1440, height: 900 },
  { name: '1920px', width: 1920, height: 1080 },
];

test.describe('Pio Languisan Portfolio Platform E2E', () => {
  test('renders cleanly with zero console/page/asset errors and intact original portrait', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedAssetResponses: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('response', (res) => {
      const url = res.url();
      // Static vite preview intentionally has no /api/* backend; only asset/html requests must succeed
      if (!url.includes('/api/') && res.status() >= 400) {
        failedAssetResponses.push(`${res.status()} ${url}`);
      }
    });

    await page.route('**/api/content', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('./', { waitUntil: 'networkidle' });

    await expect(page).toHaveTitle(/Pio Languisan/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Executive operations, technical support, and analytics'
    );

    // Ensure no floating fixed AI advisor button overlaps content
    await expect(page.locator('button.fixed.bottom-5.right-5')).toHaveCount(0);

    // Scroll through page so lazy-loaded visual assets load cleanly
    await page.locator('#about img').scrollIntoViewIfNeeded();
    await page.locator('#projects img').first().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0));

    // Verify all images (new portrait + 3 visual assets) decoded successfully
    const imageStates = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
              })
        )
      );
      return imgs.map((img) => ({
        alt: img.alt,
        src: img.getAttribute('src') || '',
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      }));
    });

    expect(imageStates.length).toBeGreaterThanOrEqual(7);
    for (const img of imageStates) {
      expect(img.complete, `Image not complete: ${img.src}`).toBe(true);
      expect(img.naturalWidth, `Image broken (naturalWidth 0): ${img.src}`).toBeGreaterThan(0);
    }

    // Verify circular PL emblem in header & footer: optimized dimensions, decorative screen reader treatment, zero square frame
    const brandLink = page.getByRole('banner').getByRole('link', { name: 'Pio Languisan' });
    await expect(brandLink).toBeVisible();
    const headerBrandInfo = await brandLink.evaluate((anchor) => {
      const img = anchor.querySelector('img');
      const span = anchor.querySelector('span');
      const aRect = anchor.getBoundingClientRect();
      const imgRect = img?.getBoundingClientRect();
      const spanRect = span?.getBoundingClientRect();
      const imgStyle = img ? window.getComputedStyle(img) : null;
      return {
        anchorHeight: aRect.height,
        imgSrc: img?.getAttribute('src') || '',
        imgAlt: img?.getAttribute('alt'),
        imgAriaHidden: img?.getAttribute('aria-hidden'),
        imgWidthAttr: img?.getAttribute('width'),
        imgHeightAttr: img?.getAttribute('height'),
        naturalWidth: img?.naturalWidth || 0,
        naturalHeight: img?.naturalHeight || 0,
        borderWidth: imgStyle?.borderWidth || '',
        borderRadius: imgStyle?.borderRadius || '',
        verticalCenterDiff:
          imgRect && spanRect
            ? Math.abs(
                imgRect.top + imgRect.height / 2 - (spanRect.top + spanRect.height / 2)
              )
            : 999,
      };
    });
    expect(headerBrandInfo.anchorHeight).toBeGreaterThanOrEqual(44);
    expect(headerBrandInfo.imgSrc).toMatch(/assets\/images\/pl-circular-emblem\.png$/);
    expect(headerBrandInfo.imgAlt).toBe('');
    expect(headerBrandInfo.imgAriaHidden).toBe('true');
    expect(headerBrandInfo.imgWidthAttr).toBe('36');
    expect(headerBrandInfo.imgHeightAttr).toBe('36');
    expect(headerBrandInfo.naturalWidth).toBe(256);
    expect(headerBrandInfo.naturalHeight).toBe(256);
    expect(headerBrandInfo.borderWidth).toBe('0px');
    expect(headerBrandInfo.borderRadius).toBe('0px');
    expect(headerBrandInfo.verticalCenterDiff).toBeLessThanOrEqual(4);

    // Verify footer uses the same circular emblem consistently
    const footerEmblem = page.locator('footer img').first();
    await expect(footerEmblem).toHaveAttribute('src', /assets\/images\/pl-circular-emblem\.png$/);
    await expect(footerEmblem).toHaveAttribute('aria-hidden', 'true');
    await expect(footerEmblem).toHaveAttribute('alt', '');

    // Verify new portrait alt text, filename, natural aspect, and static non-distorted CSS rules
    const portrait = page.getByAltText('Portrait of Pio Languisan');
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveAttribute('src', /assets\/images\/portrait-pio-languisan\.png$/);
    const portraitStyles = await portrait.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        borderRadius: style.borderRadius,
        filter: style.filter,
        transform: style.transform,
        animationName: style.animationName,
        opacity: style.opacity,
        rectWidth: rect.width,
        rectHeight: rect.height,
        naturalWidth: (el as HTMLImageElement).naturalWidth,
        naturalHeight: (el as HTMLImageElement).naturalHeight,
      };
    });
    expect(portraitStyles.naturalWidth).toBe(1199);
    expect(portraitStyles.naturalHeight).toBe(1312);
    expect(portraitStyles.borderRadius).toBe('0px');
    expect(portraitStyles.filter).toBe('none');
    expect(portraitStyles.transform).toBe('none');
    expect(portraitStyles.animationName).toBe('none');
    expect(portraitStyles.opacity).toBe('1');
    expect(portraitStyles.rectWidth).toBeGreaterThan(200);
    expect(portraitStyles.rectHeight).toBeGreaterThan(220);

    // Verify keyboard focus & Enter scroll-to-top on header brand link
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await brandLink.focus();
    await expect(brandLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 2500 })
      .toBeLessThan(120);

    // Verify zero console errors, page errors, and broken assets
    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
    expect(pageErrors, `Page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(failedAssetResponses, `Failed asset HTTP responses: ${failedAssetResponses.join('\n')}`).toEqual([]);
  });

  test('supports interactive tier switching, project filtering, modal/Esc, FAQ toggle, and anchor scroll margin', async ({
    page,
  }) => {
    await page.route('**/api/content', (route) =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' })
    );
    await page.goto('./', { waitUntil: 'networkidle' });

    // Skip link & semantic landmarks
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(page.locator('main#main-content')).toBeVisible();

    // Check section scroll-mt-20 and navigation heading visibility below sticky 64px header
    const aboutScrollMargin = await page
      .locator('#about')
      .evaluate((el) => window.getComputedStyle(el).scrollMarginTop);
    expect(aboutScrollMargin).toBe('80px');

    await page.getByRole('navigation', { name: 'Primary Navigation' }).getByRole('link', { name: 'Services' }).click();
    await page.waitForTimeout(300);
    const servicesHeadingTop = await page.locator('#services h2').evaluate((el) => el.getBoundingClientRect().top);
    expect(servicesHeadingTop).toBeGreaterThanOrEqual(64);

    // Client Tier tablist switching
    const enterpriseTab = page.getByRole('tab', { name: 'Enterprise Clients' });
    await enterpriseTab.click();
    await expect(enterpriseTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Multi-Tier Escalation Consistency')).toBeVisible();

    // Project domain filter
    await page.getByRole('button', { name: 'Data Analytics', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Executive Operations & SLA Telemetry Hub' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'AI-Assisted Client Intake & Service Scoping Engine' })
    ).toHaveCount(0);

    await page.getByRole('button', { name: 'All', exact: true }).click();

    // Open project modal and close with Escape
    await page.getByRole('button', { name: 'Inspect Blueprint Details' }).first().click();
    const projectDialog = page.getByRole('dialog');
    await expect(projectDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(projectDialog).toHaveCount(0);

    // FAQ accordion toggle
    const secondFaq = page.getByRole('button', {
      name: /Can multiple service pillars be combined/i,
    });
    await expect(secondFaq).toHaveAttribute('aria-expanded', 'false');
    await secondFaq.click();
    await expect(secondFaq).toHaveAttribute('aria-expanded', 'true');

    // Header Book Consultation CTA scrolls contact section into view
    await page.getByRole('banner').getByRole('button', { name: 'Book Consultation' }).click();
    await page.waitForTimeout(300);
    const contactTop = await page.locator('#contact h2').evaluate((el) => el.getBoundingClientRect().top);
    expect(contactTop).toBeGreaterThanOrEqual(64);
    expect(contactTop).toBeLessThan(900);

    // Mobile menu toggle, keyboard focus & drawer navigation
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileToggle = page.getByRole('button', { name: 'Open navigation menu' });
    await mobileToggle.focus();
    await expect(mobileToggle).toBeFocused();
    await mobileToggle.click();
    const mobileDrawer = page.locator('#mobile-navigation-drawer');
    await expect(mobileDrawer).toBeVisible();
    const mobileAbout = mobileDrawer.getByRole('link', { name: 'About' });
    await mobileAbout.focus();
    await expect(mobileAbout).toBeFocused();
    await mobileAbout.click();
    await expect(mobileDrawer).toHaveCount(0);
  });

  test('validates consultation submission, AI scope + drawer fallbacks, and Admin Portal without disclosed passcode', async ({
    page,
  }) => {
    await page.route('**/api/content', (route) =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' })
    );

    const seenPayloads: Array<Record<string, unknown>> = [];
    const seenSubmissionKeys: string[] = [];
    let inquiryCalls = 0;
    await page.route('**/api/inquiries', async (route) => {
      const payload = route.request().postDataJSON();
      seenPayloads.push(payload);
      seenSubmissionKeys.push(payload.submissionKey);
      inquiryCalls += 1;
      if (inquiryCalls === 1) {
        // Simulate incomplete API response without a valid tracking ID
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ inquiry: { id: '' } }),
        });
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          inquiry: {
            id: 'INQ-2026-TEST1234',
            ...payload,
            status: 'New',
            createdAt: '2026-11-17T12:00:00.000Z',
          },
        }),
      });
    });

    await page.route('**/api/admin/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'e2e-admin-token', expiresInMs: 3600000 }),
      });
    });

    await page.route('**/api/admin/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          inquiries: [
            {
              id: 'INQ-2026-SENT01',
              name: 'Jordan Taylor',
              email: 'jordan@acme-ops.example',
              phone: '+639171234567',
              company: 'Acme Ops',
              tier: 'smb',
              serviceDomain: 'data-analytics',
              timeline: 'Within 30 days',
              message: 'Need cleaner SLA reporting.',
              status: 'New',
              createdAt: '2026-11-18T10:00:00.000Z',
              emailStatus: 'sent',
              emailAttempts: 1,
              providerMessageId: '193a8f10ab',
              lastEmailHttpStatus: 200,
              lastEmailStage: 'gmail_accepted',
            },
            {
              id: 'INQ-2026-QUEUED02',
              name: 'Riley Chen',
              email: 'riley@startup.example',
              company: '',
              tier: 'startup',
              serviceDomain: 'technical-support',
              timeline: 'Immediate (1–2 weeks)',
              message: 'Support queue triage setup.',
              status: 'New',
              createdAt: '2026-11-18T09:00:00.000Z',
              emailStatus: 'pending',
              emailAttempts: 0,
            },
          ],
          projects: [],
          brand: {
            customPortraitDataUrl: null,
            customLogoDataUrl: null,
            motionEnabled: true,
            motionSensitivity: 1,
          },
        }),
      });
    });

    await page.route('**/api/admin/inquiries/*', async (route) => {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          inquiry: {
            id: 'INQ-2026-SENT01',
            name: 'Jordan Taylor',
            email: 'jordan@acme-ops.example',
            phone: '+639171234567',
            company: 'Acme Ops',
            tier: 'smb',
            serviceDomain: 'data-analytics',
            timeline: 'Within 30 days',
            message: 'Need cleaner SLA reporting.',
            status: body.status || 'In Review',
            notes: body.notes ?? '',
            createdAt: '2026-11-18T10:00:00.000Z',
            emailStatus: 'sent',
            emailAttempts: 1,
            providerMessageId: '193a8f10ab',
            lastEmailHttpStatus: 200,
            lastEmailStage: 'gmail_accepted',
          },
        }),
      });
    });

    await page.route('**/api/assistant/scope', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scope: {
            recommendedTier: 'smb',
            recommendedService: 'data-analytics',
            recommendedTimeline: 'Within 30 days',
            executiveSummary: 'Consolidate weekly spreadsheets into a single SLA reporting model.',
            actionPlan: ['Audit data sources', 'Standardize KPI metrics', 'Deploy executive dashboard'],
          },
        }),
      });
    });

    await page.route('**/api/assistant', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI Service Advisor is not configured on this server.' }),
      });
    });

    await page.goto('./', { waitUntil: 'networkidle' });

    // AI Scope Builder -> apply to form
    await page.locator('#ai-scope-input').fill('We need cleaner SLA spreadsheets and support KPIs');
    await page.getByRole('button', { name: 'Generate Scope' }).click();
    await expect(page.getByText(/Consolidate weekly spreadsheets/i)).toBeVisible();
    await page.getByRole('button', { name: 'Apply to Consultation Form' }).click();

    // Form validation rejects invalid email
    await page.locator('#consult-name').fill('Jordan Taylor');
    await page.locator('#consult-email').fill('bad-email');
    await page.getByRole('button', { name: 'Submit Consultation Request' }).click();
    await expect(page.getByRole('alert')).toContainText('valid work or personal email');

    // Keyboard searchable country picker supports shared +1 territories and pasted + numbers
    await page.locator('#consult-email').fill('jordan@acme-ops.example');
    const countryBtn = page.locator('#consult-phone-country');
    await expect(countryBtn).toContainText('Philippines (+63)');
    await countryBtn.focus();
    await page.keyboard.press('ArrowDown');
    const countrySearch = page.locator('#consult-phone-country-search');
    await expect(countrySearch).toBeFocused();
    await countrySearch.fill('+1');
    await expect(page.getByRole('option', { name: /United States \(\+1\)/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /Canada \(\+1\)/ })).toBeVisible();
    await countrySearch.fill('Canada');
    await page.keyboard.press('Enter');
    await expect(countryBtn).toContainText('Canada (+1)');
    await expect(page.locator('#consult-phone')).toBeFocused();

    // Invalid phone number triggers field-level validation error while preserving selection
    await page.locator('#consult-phone').fill('12345');
    await page.getByRole('button', { name: 'Submit Consultation Request' }).click();
    await expect(page.locator('#consult-phone-error')).toContainText('Canada (+1)');
    await expect(countryBtn).toContainText('Canada (+1)');
    await expect(page.locator('#consult-phone')).toHaveValue('12345');

    // Pasting a complete international +63 number updates country & submits normalized E.164 on retry
    await page.locator('#consult-phone').fill('+63 917 123 4567');
    await expect(countryBtn).toContainText('Philippines (+63)');

    // First submit gets incomplete response: entries (including phone & country) preserved & retry error shown
    await page.getByRole('button', { name: 'Submit Consultation Request' }).click();
    await expect(page.getByRole('alert')).toContainText('could not confirm your tracking ID');
    await expect(page.locator('#consult-name')).toHaveValue('Jordan Taylor');
    await expect(page.locator('#consult-email')).toHaveValue('jordan@acme-ops.example');
    await expect(page.locator('#consult-phone')).toHaveValue('+63 917 123 4567');
    await expect(countryBtn).toContainText('Philippines (+63)');

    // Retry sends identical submissionKey and normalized E.164 phone, displaying tracking ID cleanly
    await page.getByRole('button', { name: 'Submit Consultation Request' }).click();
    await expect(page.getByText('INQ-2026-TEST1234')).toBeVisible();
    expect(seenSubmissionKeys.length).toBe(2);
    expect(seenSubmissionKeys[0]).toBeTruthy();
    expect(seenSubmissionKeys[0]).toBe(seenSubmissionKeys[1]);
    expect(seenPayloads[0].phone).toBe('+639171234567');
    expect(seenPayloads[1].phone).toBe('+639171234567');

    // Submit another email-only inquiry without a contact number (optional field)
    await page.getByRole('button', { name: 'Submit Another Request' }).click();
    await page.locator('#consult-name').fill('Riley Chen');
    await page.locator('#consult-email').fill('riley@startup.example');
    await page.locator('#consult-message').fill('Email-only consultation inquiry without phone.');
    await page.getByRole('button', { name: 'Submit Consultation Request' }).click();
    await expect(page.getByText('INQ-2026-TEST1234')).toBeVisible();
    expect(seenPayloads[2].phone).toBeUndefined();

    // AI Advisor Drawer shows clean unavailable message when backend returns 503
    await page.getByRole('button', { name: 'Open Gemini Service Advisor' }).click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await drawer.getByLabel('Ask Service Guidance Advisor').fill('How can you help our support team?');
    await drawer.getByRole('button', { name: 'Send message' }).click();
    await expect(drawer.getByRole('alert')).toContainText('not configured');
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);

    // Admin Portal does NOT disclose hardcoded passcode, shows tel: links and Not provided, and updates inquiry status & notes
    await page.getByRole('button', { name: 'Admin Console' }).click();
    const adminDialog = page.getByRole('dialog');
    await expect(adminDialog).toBeVisible();
    const dialogText = await adminDialog.innerText();
    expect(dialogText).not.toContain('PL-EXEC-2026');

    await adminDialog.getByLabel('Executive passcode').fill('test-passcode');
    await adminDialog.getByRole('button', { name: 'Unlock Console' }).click();
    const telLink = adminDialog.getByRole('link', { name: '+639171234567' });
    await expect(telLink).toBeVisible();
    await expect(telLink).toHaveAttribute('href', 'tel:+639171234567');
    await expect(adminDialog.getByText('Contact number: Not provided')).toBeVisible();
    await expect(adminDialog.getByText('Accepted by Gmail', { exact: true })).toBeVisible();
    await expect(adminDialog.getByText('Gmail ID: 193a8f10ab')).toBeVisible();
    await expect(adminDialog.getByText('Queued', { exact: true })).toBeVisible();
    await adminDialog.getByLabel('Status for Jordan Taylor').selectOption('In Review');
    await expect(adminDialog.getByText('Updated INQ-2026-SENT01 to In Review.')).toBeVisible();
    await adminDialog.getByLabel('Notes for INQ-2026-SENT01').fill('Confirmed in inbox.');
    await adminDialog.getByRole('button', { name: 'Save Note' }).first().click();
    await expect(adminDialog.getByText('Saved triage note for INQ-2026-SENT01.')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  for (const vp of VIEWPORTS) {
    test(`has no horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.route('**/api/content', (route) =>
        route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' })
      );
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('./', { waitUntil: 'networkidle' });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth - document.documentElement.clientWidth;
      });
      expect(overflow, `Horizontal overflow detected at ${vp.name}: ${overflow}px`).toBeLessThanOrEqual(1);
    });
  }

  test('keeps searchable country picker usable on mobile with tel keyboard hints and zero overflow', async ({
    page,
  }) => {
    await page.route('**/api/content', (route) =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' })
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./', { waitUntil: 'networkidle' });

    const phoneInput = page.locator('#consult-phone');
    await phoneInput.scrollIntoViewIfNeeded();
    await expect(phoneInput).toHaveAttribute('type', 'tel');
    await expect(phoneInput).toHaveAttribute('inputmode', 'tel');
    await expect(phoneInput).toHaveAttribute('autocomplete', 'tel');

    await page.locator('#consult-phone-country').click();
    await expect(page.locator('#consult-phone-country-listbox')).toBeVisible();
    await page.locator('#consult-phone-country-search').fill('United');
    await expect(page.getByRole('option', { name: 'United States (+1)' })).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
    await expect(page.locator('#consult-phone-country-listbox')).toHaveCount(0);

    // Direct Inquiries contact links and operating hours on mobile
    const contactSection = page.locator('#contact');
    const emailLink = contactSection.getByRole('link', { name: 'pioorly.languisan@gmail.com' });
    const businessPhoneLink = contactSection.getByRole('link', { name: '+63 929 439 1755' });
    await expect(emailLink).toHaveAttribute('href', 'mailto:pioorly.languisan@gmail.com');
    await expect(businessPhoneLink).toHaveAttribute('href', 'tel:+639294391755');
    await expect(contactSection).toContainText('8:00 AM–5:00 PM PST');
    await expect(contactSection).not.toContainText('pio.executive@gmail.com');

    await emailLink.focus();
    await expect(emailLink).toBeFocused();
    await businessPhoneLink.focus();
    await expect(businessPhoneLink).toBeFocused();
  });

  test('renders Direct Inquiries links, hours, and keyboard focus cleanly on desktop', async ({
    page,
  }) => {
    await page.route('**/api/content', (route) =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' })
    );
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./', { waitUntil: 'networkidle' });

    const contactSection = page.locator('#contact');
    await contactSection.scrollIntoViewIfNeeded();
    const emailLink = contactSection.getByRole('link', { name: 'pioorly.languisan@gmail.com' });
    const businessPhoneLink = contactSection.getByRole('link', { name: '+63 929 439 1755' });

    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute('href', 'mailto:pioorly.languisan@gmail.com');
    await expect(businessPhoneLink).toBeVisible();
    await expect(businessPhoneLink).toHaveAttribute('href', 'tel:+639294391755');
    await expect(contactSection).toContainText('8:00 AM–5:00 PM PST');
    await expect(contactSection).not.toContainText('pio.executive@gmail.com');

    await emailLink.focus();
    await expect(emailLink).toBeFocused();
    await businessPhoneLink.focus();
    await expect(businessPhoneLink).toBeFocused();
  });
});
