const tabs = document.querySelectorAll('.tab');
const tabContents = {
  url: document.getElementById('url-content'),
  image: document.getElementById('image-content'),
};

const urlInput = document.getElementById('urlInput');
const fetchUrlBtn = document.getElementById('fetchUrlBtn');
const manualText = document.getElementById('manualText');
const imageInput = document.getElementById('imageInput');
const imagePreviewWrap = document.getElementById('imagePreviewWrap');
const imagePreview = document.getElementById('imagePreview');
const imageNotes = document.getElementById('imageNotes');
const analyzeBtn = document.getElementById('analyzeBtn');

const resultsSection = document.getElementById('results');
const scoreValue = document.getElementById('scoreValue');
const scoreBand = document.getElementById('scoreBand');
const frameworkList = document.getElementById('frameworkList');
const funnelList = document.getElementById('funnelList');
const strengthList = document.getElementById('strengthList');
const addList = document.getElementById('addList');
const removeList = document.getElementById('removeList');
const priorityList = document.getElementById('priorityList');

let activeTab = 'url';

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activeTab = tab.dataset.tab;
    tabs.forEach((t) => t.classList.toggle('active', t === tab));
    tabs.forEach((t) => t.setAttribute('aria-selected', t === tab));
    Object.entries(tabContents).forEach(([key, panel]) => {
      panel.classList.toggle('active', key === activeTab);
    });
  });
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file) {
    imagePreviewWrap.classList.add('hidden');
    return;
  }
  imagePreview.src = URL.createObjectURL(file);
  imagePreviewWrap.classList.remove('hidden');
});

fetchUrlBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    alert('Please enter a URL first.');
    return;
  }

  fetchUrlBtn.disabled = true;
  fetchUrlBtn.textContent = 'Fetching...';

  try {
    const proxy = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
    const response = await fetch(proxy);
    const text = await response.text();

    if (!response.ok || text.length < 80) {
      throw new Error('Insufficient content received.');
    }

    manualText.value = text.slice(0, 6000);
  } catch (error) {
    alert('Could not fetch URL content automatically. Please paste text manually.');
  } finally {
    fetchUrlBtn.disabled = false;
    fetchUrlBtn.textContent = 'Fetch page text';
  }
});

analyzeBtn.addEventListener('click', () => {
  const rawText = activeTab === 'url' ? manualText.value : imageNotes.value;

  if (!rawText.trim()) {
    alert('Please provide page text/notes so I can analyze it.');
    return;
  }

  const analysis = analyzeLandingPage(rawText);
  renderAnalysis(analysis);
});

function analyzeLandingPage(input) {
  const text = input.toLowerCase();
  let score = 50;

  const hasHeadline = /(\n|^).{10,80}/.test(input);
  const hasCta = /(get started|sign up|book|buy|start free|try now|request demo|download)/.test(text);
  const hasSocialProof = /(testimonial|reviews|trusted by|case study|rating|customers)/.test(text);
  const hasOffer = /(free trial|discount|bonus|money[- ]back|guarantee|limited time)/.test(text);
  const hasUrgency = /(today only|limited|ends soon|spots left|countdown)/.test(text);
  const hasRiskReversal = /(refund|cancel anytime|no credit card|money back|guarantee)/.test(text);
  const hasClarity = /(for\s+[a-z ]+\s+who|helps you|so you can|without)/.test(text);
  const tooLongBlocks = input.split('\n').some((line) => line.length > 220);

  if (hasHeadline) score += 8;
  if (hasCta) score += 12;
  if (hasSocialProof) score += 10;
  if (hasOffer) score += 8;
  if (hasUrgency) score += 5;
  if (hasRiskReversal) score += 7;
  if (hasClarity) score += 8;
  if (tooLongBlocks) score -= 8;

  score = Math.max(0, Math.min(100, score));

  const framework = [
    hasHeadline ? 'Value proposition appears present (clear headline detected).' : 'Value proposition is weak or unclear; sharpen the first headline.',
    hasClarity ? 'Message-to-market fit language appears in the copy.' : 'Audience specificity is missing. Name the ICP directly.',
    hasOffer ? 'Offer mechanics are visible (trial/discount/guarantee cues found).' : 'Offer is not obvious. Add concrete incentive or package details.',
  ];

  const funnel = [
    hasCta ? 'Top-of-funnel action is visible with at least one CTA.' : 'CTA friction is high: no obvious next step detected.',
    hasSocialProof ? 'Mid-funnel trust support exists via proof signals.' : 'Trust gap in consideration stage: add testimonials/case studies.',
    hasRiskReversal ? 'Bottom-of-funnel objection handling appears present.' : 'Decision-stage reassurance is low; add guarantee/refund/cancel-anytime.',
  ];

  const strengths = [
    hasHeadline ? 'You likely communicate intent quickly above the fold.' : null,
    hasCta ? 'The page pushes users toward a measurable action.' : null,
    hasSocialProof ? 'Social validation can reduce skepticism and boost confidence.' : null,
    hasOffer ? 'Offer framing may improve perceived value and response rate.' : null,
  ].filter(Boolean);

  const additions = [
    !hasSocialProof ? 'Add 2–3 specific testimonials with outcomes (numbers if possible).' : null,
    !hasRiskReversal ? 'Add risk reversal (free trial, guarantee, cancel anytime).' : null,
    !hasUrgency ? 'Introduce ethical urgency (deadline, limited seats, launch window).' : null,
    !hasClarity ? 'Clarify who this is for and the main pain it solves in one sentence.' : null,
    'Run A/B tests on hero headline and primary CTA text.',
  ].filter(Boolean);

  const removals = [
    tooLongBlocks ? 'Reduce long paragraphs; break copy into short, scannable blocks.' : null,
    'Remove generic claims like “best solution” unless proven with evidence.',
    'Avoid multiple conflicting CTAs above the fold; keep one primary action.',
  ].filter(Boolean);

  const priorities = [
    hasCta ? 'Improve CTA clarity: make value of clicking explicit.' : 'Create one primary CTA above the fold and repeat it in key sections.',
    hasSocialProof ? 'Make proof more concrete with quantified outcomes.' : 'Add social proof near CTA and pricing/offer sections.',
    hasClarity ? 'Tighten headline with stronger benefit + timeframe.' : 'Rewrite hero with clear audience + pain + promised outcome.',
  ];

  return {
    score,
    band: score >= 75 ? 'Strong' : score >= 55 ? 'Moderate' : 'Needs work',
    framework,
    funnel,
    strengths,
    additions,
    removals,
    priorities,
  };
}

function renderList(el, items) {
  el.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = 'No strong signals detected from the provided input.';
    el.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    el.appendChild(li);
  });
}

function renderAnalysis(analysis) {
  resultsSection.classList.remove('hidden');
  scoreValue.textContent = `${analysis.score}/100`;
  scoreBand.textContent = analysis.band;

  scoreValue.style.color = analysis.score >= 75 ? '#22c55e' : analysis.score >= 55 ? '#f59e0b' : '#f87171';

  renderList(frameworkList, analysis.framework);
  renderList(funnelList, analysis.funnel);
  renderList(strengthList, analysis.strengths);
  renderList(addList, analysis.additions);
  renderList(removeList, analysis.removals);
  renderList(priorityList, analysis.priorities);
}
