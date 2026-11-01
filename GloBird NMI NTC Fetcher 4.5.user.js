// ==UserScript==
// @name         GloBird NMI NTC Fetcher (Quote Tool Bridge)
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  Looks up NMIs on the GloBird Sales Portal and sends NTC, distributor and FULLHOUSE/GLOHOME rates to the Quote Tool.
// @author       You
// @match        https://globird-salesportal.azurewebsites.net/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // CONFIG
  // ---------------------------------------------------------------------

  const API_URL =
    'https://globird-salesportal.azurewebsites.net/api/Quote/ElectricityQuoteByNmi';

  const GAS_API_URL =
    'https://globird-salesportal.azurewebsites.net/api/Quote/GasQuoteByMirn';

  const SALES_EMAIL = 'ozutilitiesglobird@gmail.com';
  const SALES_NAME = 'Nescorp Channel';

  const SINGLE_MESSAGE_TYPE = 'globird-ntc-lookup-result';
  const BULK_MESSAGE_TYPE = 'globird-ntc-bulk-result';

  const QP_AUTO_NMI = 'ntc_lookup_nmi';
  const QP_BULK_NMI = 'ntc_lookup_bulk';
  const QP_REPLY_ORIGIN = 'ntc_origin';

  const DELAY_MS = 1000;


  // ---------------------------------------------------------------------
  // COMMON HELPERS
  // ---------------------------------------------------------------------

  const stripHtml = h =>
    String(h || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const grab = (h, label) => {
    const m = String(h).match(
      new RegExp(
        '<b>\\s*' + label + '\\s*:?\\s*</b>\\s*([^<]*)',
        'i'
      )
    );

    return m ? m[1].trim() : '';
  };


  // ---------------------------------------------------------------------
  // NTC SALVAGE FROM ERROR RESPONSES
  // ---------------------------------------------------------------------

  function salvageFromMessage(nmi, msg, fuel) {
    fuel = fuel || 'electricity';

    const ntc = grab(msg, 'NTC');

    if (!ntc) return null;

    const reason =
      grab(msg, 'Electricity Error Reason[^<]*') ||
      stripHtml(msg).slice(0, 200);

    return {
      nmi: nmi,
      fuel: fuel,
      ntc: ntc,

      electricityNtc: fuel === 'gas' ? null : ntc,
      gasNtc: fuel === 'gas' ? ntc : null,

      distributorName: null,
      distributorCode: null,
      meterType: null,
      isEnergized: null,

      stateCode: null,
      postcode: null,
      address: grab(msg, 'Address') || null,

      warning:
        'GloBird cannot currently quote this meter' +
        (reason ? ' (' + reason + ')' : '') +
        ' - the NTC was taken from the error message.'
    };
  }


  async function salvageFromBody(nmi, res, fuel) {
    try {
      const text = await res.text();

      let msg = text;

      try {
        const j = JSON.parse(text);
        msg = (j && j.message) || text;
      } catch (e) {
        // Plain text or HTML response.
      }

      return salvageFromMessage(nmi, msg, fuel);

    } catch (e) {
      return null;
    }
  }


  // ---------------------------------------------------------------------
  // ELECTRICITY LOOKUP
  // ---------------------------------------------------------------------

  async function fetchQuoteByNmi(nmi) {

    const res = await fetch(API_URL, {
      method: 'POST',
      credentials: 'same-origin',

      headers: {
        'Content-Type': 'application/json',
        'X-Email': SALES_EMAIL
      },

      body: JSON.stringify({
        nmi: nmi,
        electricityQuoteCheckGas: true,
        anotherFuelQuotableCheck: false,
        salesName: SALES_NAME,
        salesEmail: SALES_EMAIL
      })
    });


    if (!res.ok) {

      const salvaged = await salvageFromBody(nmi, res);

      if (salvaged) return salvaged;

      const e = new Error(
        `Portal API returned HTTP ${res.status}` +
        (
          res.status === 401 || res.status === 403
            ? ' (not logged in?)'
            : ''
        )
      );

      e.status = res.status;

      throw e;
    }


    const json = await res.json();


    if (!json || json.success !== true) {

      const msg = (json && json.message) || '';

      const salvaged = salvageFromMessage(nmi, msg);

      if (salvaged) return salvaged;

      throw new Error(
        stripHtml(msg) || 'Portal API returned success:false'
      );
    }


    return normalizeQuote(nmi, json);
  }



  // ---------------------------------------------------------------------
  // GAS LOOKUP
  // ---------------------------------------------------------------------

  // This request body is retained from v4.4.
  // If the portal requires different gas request parameters,
  // those must be taken from the actual portal Network request.

  const GAS_BODY = mirn => ({
    mirn: mirn,
    salesName: SALES_NAME,
    salesEmail: SALES_EMAIL
  });


  async function fetchGasByMirn(mirn) {

    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      credentials: 'same-origin',

      headers: {
        'Content-Type': 'application/json',
        'X-Email': SALES_EMAIL
      },

      body: JSON.stringify(GAS_BODY(mirn))
    });


    if (!res.ok) {

      const salvaged = await salvageFromBody(
        mirn,
        res,
        'gas'
      );

      if (salvaged) return salvaged;

      const e = new Error(
        `Portal gas API returned HTTP ${res.status}` +
        (
          res.status === 401 || res.status === 403
            ? ' (not logged in?)'
            : ''
        )
      );

      e.status = res.status;

      throw e;
    }


    const json = await res.json();

    console.log(
      '[GloBird NTC Fetcher] gas response',
      json
    );


    if (!json || json.success !== true) {

      const msg = (json && json.message) || '';

      const salvaged = salvageFromMessage(
        mirn,
        msg,
        'gas'
      );

      if (salvaged) return salvaged;

      throw new Error(
        stripHtml(msg) || 'Portal gas API returned success:false'
      );
    }


    return normalizeGas(mirn, json);
  }



  // ---------------------------------------------------------------------
  // GAS RESPONSE NORMALISATION
  // ---------------------------------------------------------------------

  function normalizeGas(mirn, json) {

    const data = json.data || {};

    const gas =
      data.gasQuote ||
      data.quote ||
      null;


    if (
      !gas ||
      (
        data.gasResultCode !== undefined &&
        data.gasResultCode !== 0
      )
    ) {
      throw new Error('No gas quote found for this MIRN.');
    }


    const ntc =
      gas.ntcs ||
      gas.ntc ||
      null;


    return {

      nmi: mirn,
      fuel: 'gas',

      ntc: ntc,

      electricityNtc: null,
      gasNtc: ntc,

      distributorName:
        gas.distributorName || null,

      distributorCode:
        gas.distributorCode || null,

      meterType: null,
      isEnergized: null,

      stateCode:
        gas.stateCode || null,

      postcode:
        gas.postcode || null,

      address:
        gas.address || null,

      // NEW: extract rates and discounts from gas response too.
      productRates: normalizeMarketProducts(gas, data)

    };
  }



  // ---------------------------------------------------------------------
  // FULLHOUSE + GLOHOME RATE EXTRACTION
  // ---------------------------------------------------------------------

  function containsNonZeroNumber(value) {

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (Array.isArray(value)) {
      return value.some(containsNonZeroNumber);
    }

    if (value && typeof value === 'object') {
      return Object.values(value).some(containsNonZeroNumber);
    }

    return false;
  }



  // Search nested response objects.
  // This is important because electricity and gas responses
  // may store MarketOffer at different nesting levels.

  function findNestedValue(root, predicate) {

    const seen = new Set();
    const stack = [root];

    while (stack.length) {

      const current = stack.pop();

      if (
        !current ||
        typeof current !== 'object' ||
        seen.has(current)
      ) {
        continue;
      }

      seen.add(current);

      try {

        const found = predicate(current);

        if (found) return found;

      } catch (e) {
        // Ignore malformed branches.
      }


      for (const value of Object.values(current)) {

        if (value && typeof value === 'object') {
          stack.push(value);
        }
      }
    }

    return null;
  }



  function normalizeMarketProducts(quote, data) {

    // Look for MarketOffer in the quote first.
    // If not found, search the complete API response.

    const findOffers = root =>
      findNestedValue(root, obj => {

        const offers =
          obj.offerTypeCodeProducts?.MarketOffer;

        return (
          offers &&
          typeof offers === 'object' &&
          Object.keys(offers).length
        )
          ? offers
          : null;
      });


    const marketOffers =
      findOffers(quote) ||
      findOffers(data) ||
      {};


    const wanted = [
      'FULLHOUSE',
      'GLOHOME',
      'NINETOFIVEBIZ',
      'GLOBIZ'

    ];

    const products = {};


    for (const product of Object.values(marketOffers)) {

      if (
        !product ||
        !wanted.includes(product.name)
      ) {
        continue;
      }


      const productId = product.productId;


      // Locate package data by product ID.
      // The package data can be nested differently between endpoints.

      const packageList =

        findNestedValue(data, obj => {

          const candidate = obj[String(productId)];

          return Array.isArray(candidate)
            ? candidate
            : null;

        }) ||

        findNestedValue(quote, obj => {

          const candidate = obj[String(productId)];

          return Array.isArray(candidate)
            ? candidate
            : null;

        }) ||

        [];


      // ---------------------------------------------------------------
      // PRICE PLANS
      // ---------------------------------------------------------------

      const ratePlans = Object.entries(
        product.prices || {}
      ).map(([pricePlanId, rates]) => {

        const tariff =
          product.pricePlanIdMainTariffIdMapping?.[pricePlanId] ||
          null;


        return {

          pricePlanId: pricePlanId,

          tariff: tariff
            ? {

                tariffTypeId:
                  tariff.tariffTypeId ?? null,

                tariffTypeCode:
                  tariff.tariffTypeCode ?? null,

                customerType:
                  tariff.customerType ?? null,

                tariffTypeMappingSetId:
                  tariff.tariffTypeMappingSetId ?? null,

                ratioMaps:
                  tariff.ratioMaps || []

              }
            : null,


          rates: (
            Array.isArray(rates)
              ? rates
              : []
          ).map(rate => ({

            chargeTypeName:
              rate.chargeTypeName ||
              rate.chargeTypeCode ||
              null,

            chargeTypeCode:
              rate.chargeTypeCode || null,

            fullPrice:
              rate.fullPrice ?? null,

            unit:
              rate.unit || null,

            stepStart:
              rate.stepStart ?? null,

            stepEnd:
              rate.stepEnd ?? null,

            isGstApplicable:
              rate.isGstApplicable ?? null

          }))

        };

      });



      // ---------------------------------------------------------------
      // PACKAGE DISCOUNTS
      // ---------------------------------------------------------------

      const discounts = packageList.map(pkg => {

        const mapping =
          pkg.productPackageMapping || {};

        const discountDictionary =
          mapping.discountDictionary || {};

        const feesByStateCode =
          mapping.feesByStateCode ||
          pkg.feesByStateCode ||
          null;


        return {

          productPackageId:
            pkg.productPackageId ?? null,

          packageId:
            pkg.packageId ?? null,

          packageDescription:
            pkg.packageDescription ||
            pkg.description ||
            null,

          isBasic:
            pkg.isBasic ?? null,

          discountDictionary:
            discountDictionary,

          feesByStateCode:
            feesByStateCode

        };

      }).filter(pkg =>

        containsNonZeroNumber(
          pkg.discountDictionary
        ) ||

        containsNonZeroNumber(
          pkg.feesByStateCode
        )

      );


      products[product.name] = {

        productId: productId,

        ratePlans: ratePlans,

        discounts: discounts

      };

    }


    return products;
  }



  // ---------------------------------------------------------------------
  // RETRY LOGIC
  // ---------------------------------------------------------------------

  async function withRetry(fn, id) {

    try {

      return await fn(id);

    } catch (err) {

      const transient =
        err instanceof TypeError ||
        err.status === 429 ||
        err.status >= 500;


      if (!transient) {
        throw err;
      }


      await new Promise(r =>
        setTimeout(r, 2000)
      );


      return fn(id);
    }
  }



  // ---------------------------------------------------------------------
  // ROUTING
  // ---------------------------------------------------------------------

  // An identifier beginning with 5 is treated as a gas MIRN.
  // Everything else is treated as an electricity NMI.

  const isGasId = id =>
    /^5/.test(String(id).trim());


  const fetchWithRetry = id =>
    withRetry(
      isGasId(id)
        ? fetchGasByMirn
        : fetchQuoteByNmi,
      id
    );



  // ---------------------------------------------------------------------
  // ELECTRICITY RESPONSE NORMALISATION
  // ---------------------------------------------------------------------

  function normalizeQuote(nmi, json) {

    const data = json.data || {};

    const elec =
      data.electricityQuote || null;

    const gas =
      data.gasQuote || null;


    const elecOk =
      data.electricityResultCode === 0 &&
      elec;

    const gasOk =
      data.gasResultCode === 0 &&
      gas;


    if (!elecOk && !gasOk) {
      throw new Error(
        'No electricity or gas quote found for this NMI/MIRN.'
      );
    }


    const primary =
      elecOk ? elec : gas;


    return {

      nmi: nmi,

      fuel: elecOk
        ? 'electricity'
        : 'gas',

      ntc:
        primary.ntcs || null,

      distributorName:
        primary.distributorName || null,

      distributorCode:
        primary.distributorCode || null,

      meterType:
        elecOk
          ? (elec.meterType || null)
          : null,

      isEnergized:
        elecOk
          ? !!elec.isEnergized
          : null,

      stateCode:
        primary.stateCode || null,

      postcode:
        primary.postcode || null,

      address:
        primary.address || null,

      electricityNtc:
        elecOk
          ? (elec.ntcs || null)
          : null,

      gasNtc:
        gasOk
          ? (gas.ntcs || null)
          : null,

      // Electricity rates.
      productRates:
        elecOk
          ? normalizeMarketProducts(elec, data)
          : {}

    };
  }



  // ---------------------------------------------------------------------
  // QUOTE TOOL BRIDGE
  // ---------------------------------------------------------------------

  function replyOrigin() {

    const o =
      new URLSearchParams(window.location.search)
        .get(QP_REPLY_ORIGIN);

    try {

      return o
        ? new URL(o).origin
        : '*';

    } catch (e) {

      return '*';

    }
  }



  function post(message) {

    if (!window.opener) {
      return false;
    }

    try {

      window.opener.postMessage(
        message,
        replyOrigin()
      );

      return true;

    } catch (e) {

      console.error(
        '[GloBird NTC Fetcher] postMessage failed:',
        e
      );

      return false;
    }
  }



  const sendSingle = r => post({

    type: SINGLE_MESSAGE_TYPE,

    nmi: r.nmi,
    ntc: r.ntc,
    fuel: r.fuel,

    distributorName:
      r.distributorName,

    meterType:
      r.meterType,

    warning:
      r.warning || null,

    productRates:
      r.productRates || {}

  });



  const sendBulk = (results, errors) =>
    post({

      type: BULK_MESSAGE_TYPE,

      results: results,

      errors: errors

    });



  // ---------------------------------------------------------------------
  // FLOATING PANEL
  // ---------------------------------------------------------------------

  function buildPanel() {

    const div = document.createElement('div');

    div.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 999999;
      padding: 14px;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      font-family: Arial, sans-serif;
      font-size: 13px;
      width: 320px;
    `;


    div.innerHTML = `

      <div style="font-weight:bold; margin-bottom:6px;">
        GloBird NTC Fetcher
        <span style="color:#999;font-weight:normal">
          v4.5
        </span>
      </div>

      <div style="display:flex; gap:6px; margin-bottom:8px;">

        <input
          type="text"
          id="ntc-nmi-input"
          placeholder="Enter NMI/MIRN"
          style="flex:1; padding:4px 6px; border:1px solid #ccc; border-radius:4px;"
        />

        <button
          id="ntc-fetch-btn"
          style="padding:4px 10px; border-radius:4px; border:1px solid #888; background:#f5f5f5; cursor:pointer;"
        >
          Get NTC
        </button>

      </div>

      <div
        id="ntc-status"
        style="color:#666; margin-bottom:6px;"
      ></div>

      <div
        id="ntc-result"
        style="display:none; border-top:1px solid #eee; padding-top:6px;"
      >

        <div>
          <b>NTC:</b>
          <span id="ntc-value" style="font-family:monospace;"></span>
        </div>

        <div>
          <b>Fuel:</b>
          <span id="ntc-fuel"></span>
        </div>

        <div>
          <b>Distributor:</b>
          <span id="ntc-dist"></span>
        </div>

        <div
          id="ntc-rates"
          style="display:none; margin-top:8px; padding-top:6px; border-top:1px solid #eee;"
        >

          <b>FULLHOUSE / GLOHOME rates &amp; discounts:</b>

          <pre
            id="ntc-rates-value"
            style="white-space:pre-wrap; overflow-wrap:anywhere; max-height:220px; overflow:auto; margin:4px 0 0; font:11px Arial,sans-serif;"
          ></pre>

        </div>

      </div>
    `;


    document.body.appendChild(div);


    const els = {

      input:
        div.querySelector('#ntc-nmi-input'),

      fetchBtn:
        div.querySelector('#ntc-fetch-btn'),

      status:
        div.querySelector('#ntc-status'),

      resultBox:
        div.querySelector('#ntc-result'),

      value:
        div.querySelector('#ntc-value'),

      fuel:
        div.querySelector('#ntc-fuel'),

      dist:
        div.querySelector('#ntc-dist'),

      ratesBox:
        div.querySelector('#ntc-rates'),

      ratesValue:
        div.querySelector('#ntc-rates-value')

    };



    // ---------------------------------------------------------------
    // DISPLAY RESULT
    // ---------------------------------------------------------------

    const show = r => {

      els.value.textContent =
        r.ntc || '(none returned)';

      els.fuel.textContent =
        r.fuel;

      els.dist.textContent =
        r.distributorName || '—';


      const productRates =
        r.productRates || {};

      const rateLines = [];


      for (const productName of [
        'FULLHOUSE',
        'GLOHOME',
      'NINETOFIVEBIZ',
      'GLOBIZ'
      ]) {

        const product =
          productRates[productName];

        if (!product) continue;


        rateLines.push(productName);


        for (const plan of (
          product.ratePlans || []
        )) {

          if (plan.tariff?.tariffTypeCode) {

            rateLines.push(
              '  Tariff: ' +
              plan.tariff.tariffTypeCode
            );

          }


          for (const rate of (
            plan.rates || []
          )) {

            const step =
              rate.stepEnd == null

                ? (
                    rate.stepStart
                      ? ' (from ' + rate.stepStart + ')'
                      : ''
                  )

                : (
                    ' (' +
                    rate.stepStart +
                    '–' +
                    rate.stepEnd +
                    ')'
                  );


            rateLines.push(

              '  ' +

              (
                rate.chargeTypeName ||
                rate.chargeTypeCode ||
                'Rate'
              ) +

              ': ' +

              rate.fullPrice +

              ' ' +

              (rate.unit || '') +

              step

            );

          }
        }



        // PACKAGE DISCOUNTS

        for (const pkg of (
          product.discounts || []
        )) {

          const activeDiscounts =
            Object.entries(
              pkg.discountDictionary || {}
            )

            .filter(([, value]) =>
              typeof value === 'number' &&
              value !== 0
            )

            .map(([key, value]) =>
              key + ': ' + (value * 100) + '%'
            );


          if (activeDiscounts.length) {

            rateLines.push(

              '  Discounts (' +
              (pkg.packageDescription || 'Package') +
              '): ' +

              activeDiscounts.join(', ')

            );

          }


          if (pkg.feesByStateCode) {

            rateLines.push(

              '  Package benefits/fees: ' +

              JSON.stringify(
                pkg.feesByStateCode
              )

            );

          }

        }

      }


      els.ratesValue.textContent =
        rateLines.join('\n');

      els.ratesBox.style.display =
        rateLines.length
          ? 'block'
          : 'none';


      els.resultBox.style.display =
        'block';


      if (r.warning) {

        els.status.textContent =
          '⚠️ ' + r.warning;

      }

    };



    // ---------------------------------------------------------------
    // SINGLE LOOKUP
    // ---------------------------------------------------------------

    async function runLookup(nmi) {

      els.status.textContent =
        `Fetching quote for ${nmi}…`;

      els.resultBox.style.display =
        'none';

      els.fetchBtn.disabled =
        true;


      try {

        const result =
          await fetchWithRetry(nmi);

        els.status.textContent =
          '✅ Done.';

        show(result);

        return result;

      } catch (err) {

        els.status.textContent =
          `❌ Error: ${err.message}`;

        return null;

      } finally {

        els.fetchBtn.disabled =
          false;

      }

    }



    // ---------------------------------------------------------------
    // BULK LOOKUP
    // ---------------------------------------------------------------

    async function runBulkLookup(nmiList) {

      els.resultBox.style.display =
        'none';

      els.fetchBtn.disabled =
        true;


      const results = [];
      const errors = [];


      for (
        let i = 0;
        i < nmiList.length;
        i++
      ) {

        const nmi =
          nmiList[i];

        els.input.value =
          nmi;

        els.status.textContent =
          `Fetching ${i + 1} of ${nmiList.length} (NMI: ${nmi})...`;


        try {

          const result =
            await fetchWithRetry(nmi);

          results.push(result);

          show(result);

        } catch (err) {

          console.error(
            `Failed to fetch NMI ${nmi}:`,
            err
          );

          errors.push({

            nmi: nmi,

            error: err.message

          });

        }


        if (i < nmiList.length - 1) {

          await new Promise(r =>
            setTimeout(r, DELAY_MS)
          );

        }

      }


      els.fetchBtn.disabled =
        false;


      return {
        results: results,
        errors: errors
      };

    }



    // ---------------------------------------------------------------
    // BUTTON
    // ---------------------------------------------------------------

    els.fetchBtn.addEventListener(
      'click',
      () => {

        const n =
          els.input.value.trim();

        if (n) {
          runLookup(n);
        }

      }
    );


    return {

      els: els,

      runLookup: runLookup,

      runBulkLookup: runBulkLookup

    };

  }



  // ---------------------------------------------------------------------
  // AUTOMATIC LOOKUP MODE
  // ---------------------------------------------------------------------

  async function maybeRunAutoMode(panel) {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const { els } = panel;


    // BULK MODE

    const bulk =
      params.get(QP_BULK_NMI);


    if (bulk) {

      const list = [
        ...new Set(
          bulk
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        )
      ];


      const {
        results,
        errors
      } = await panel.runBulkLookup(list);


      if (sendBulk(results, errors)) {

        els.status.textContent =
          `✅ Done (${results.length} found` +
          (
            errors.length
              ? ', ' + errors.length + ' failed'
              : ''
          ) +
          '). Sending back to Quote Tool…';


        setTimeout(() =>
          window.close(),
          1000
        );

      } else {

        els.status.textContent =
          '⚠️ Finished, but could not find the Quote Tool tab to send data back.';

      }

      return;
    }



    // SINGLE MODE

    const one =
      params.get(QP_AUTO_NMI);


    if (one) {

      els.input.value =
        one;


      const result =
        await panel.runLookup(one);


      if (!result) return;


      if (sendSingle(result)) {

        els.status.textContent =
          '✅ Sent to Quote Tool — closing this tab…';


        setTimeout(() =>
          window.close(),
          600
        );

      } else {

        els.status.textContent =
          '⚠️ Fetched the NTC, but could not find the Quote Tool tab to send data back. Copy it manually.';

      }

    }

  }



  // ---------------------------------------------------------------------
  // INITIALISE
  // ---------------------------------------------------------------------

  function init() {

    maybeRunAutoMode(
      buildPanel()
    );

  }


  if (document.body) {

    init();

  } else {

    window.addEventListener(
      'DOMContentLoaded',
      init
    );

  }

})();
