// Enable one muted mobile preview at a time, including dynamically inserted cards.
export function enableMobileVideoPreviews(
  container: ParentNode,
  selector = '[data-mobile-video-preview]'
): void {
  const mobile = window.matchMedia(
    '(max-width: 900px) and (pointer: coarse)'
  );

  const observed = new Set<HTMLElement>();

  let selected: HTMLElement | null = null;
  let active: HTMLElement | null = null;
  let pending: number | null = null;
  let scheduled = false;

  const stop = (): void => {
    if (pending !== null) {
      window.clearTimeout(pending);
    }

    pending = null;

    if (active) {
      active.querySelector(
        'iframe[data-mobile-preview-frame]'
      )?.remove();
    }

    active = null;
  };

  const start = (host: HTMLElement): void => {
    const id = host.dataset.mobileVideoPreview || '';

    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    if (!host.isConnected) return;

    const frame = document.createElement('iframe');

    frame.dataset.mobilePreviewFrame = '1';
    frame.title = 'Muted video preview';

    frame.setAttribute('aria-hidden', 'true');

    frame.tabIndex = -1;

    frame.allow =
      'autoplay; encrypted-media; picture-in-picture';

    frame.src =
      `https://www.youtube-nocookie.com/embed/${id}` +
      '?autoplay=1' +
      '&mute=1' +
      '&controls=0' +
      '&playsinline=1' +
      '&modestbranding=1' +
      '&rel=0';

    Object.assign(frame.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      border: '0',
      display: 'block',
      pointerEvents: 'none',
      opacity: '0',
      zIndex: '2'
    });

    frame.addEventListener(
      'load',
      () => {
        frame.style.opacity = '1';
      },
      { once: true }
    );

    host.appendChild(frame);

    active = host;
  };

  const bestVisible = (): HTMLElement | null => {
    const viewportHeight =
      window.innerHeight ||
      document.documentElement.clientHeight;

    const candidates: {
      host: HTMLElement;
      score: number;
    }[] = [];

    const center = Math.max(
      56,
      Math.min(viewportHeight, viewportHeight * 0.54)
    );

    for (const host of observed) {
      if (!host.isConnected) {
        observed.delete(host);
        continue;
      }

      if (
        host.getClientRects().length === 0 ||
        host.closest('[hidden], .is-hidden')
      ) {
        continue;
      }

      const rect = host.getBoundingClientRect();

      if (
        rect.width < 80 ||
        rect.height < 45 ||
        rect.bottom <= 56 ||
        rect.top >= viewportHeight
      ) {
        continue;
      }

      const visible =
        Math.min(rect.bottom, viewportHeight) -
        Math.max(rect.top, 56);

      if (
        visible < 45 ||
        visible < rect.height * 0.25
      ) {
        continue;
      }

      const score =
        visible / rect.height -
        Math.abs(
          rect.top + rect.height / 2 - center
        ) / viewportHeight;

      candidates.push({ host, score });
    }

    if (candidates.length === 0) {
      return null;
    }

    // Prioritize the first visible card when the page opens at the top.
    const scrollTop =
      document.scrollingElement?.scrollTop ??
      window.scrollY;

    if (scrollTop <= 80) {
      return candidates[0].host;
    }

    candidates.sort((a, b) => b.score - a.score);

    return candidates[0].host;
  };

  const update = (): void => {
    if (!mobile.matches || document.hidden) {
      selected = null;
      stop();
      return;
    }

    const next = bestVisible();

    if (
      selected === next &&
      (active === next || pending !== null)
    ) {
      return;
    }

    selected = next;

    stop();

    if (!next) return;

    pending = window.setTimeout(() => {
      pending = null;

      if (
        mobile.matches &&
        !document.hidden &&
        selected === next &&
        bestVisible() === next
      ) {
        start(next);
      }
    }, 350);
  };

  const schedule = (): void => {
    if (scheduled) return;

    scheduled = true;

    window.requestAnimationFrame(() => {
      scheduled = false;
      update();
    });
  };

  const scan = (): void => {
    for (
      const host of Array.from(
        container.querySelectorAll<HTMLElement>(selector)
      )
    ) {
      observed.add(host);
    }

    schedule();
  };

  // Detect cards already present when the page first opens.
  scan();

  // Detect cards added during initial loading or feed updates.
  const mutations = new MutationObserver(scan);

  mutations.observe(container, {
    childList: true,
    subtree: true
  });

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      scan,
      { once: true }
    );
  }

  window.addEventListener(
    'load',
    scan,
    { once: true }
  );

  document.addEventListener(
    'scroll',
    schedule,
    {
      capture: true,
      passive: true
    }
  );

  window.addEventListener('resize', schedule);

  window.addEventListener('pageshow', scan);

  document.addEventListener(
    'visibilitychange',
    schedule
  );

  window.addEventListener('pagehide', () => {
    selected = null;
    stop();
  });

  mobile.addEventListener?.('change', schedule);
}
