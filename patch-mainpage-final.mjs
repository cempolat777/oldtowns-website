import fs from 'node:fs';

const file = './src/components/MainPage.astro';

let source = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const original = source;

function replaceExact(before, after, label) {
  const first = source.indexOf(before);
  const second = first === -1 ? -1 : source.indexOf(before, first + 1);

  if (first === -1 || second !== -1) {
    throw new Error(`${label}: expected exactly one match.`);
  }

  source =
    source.slice(0, first) +
    after +
    source.slice(first + before.length);
}

replaceExact(
`              var allWrappers = Array.prototype.slice.call(grid.querySelectorAll('.video-card-wrapper'));
              var wrappers = allWrappers.filter(function (wrapper) { return wrapper.style.display !== 'none'; });
              var documentaryWrappers = allWrappers.filter(function (wrapper) { return wrapper.style.display === 'none'; });
              grid.querySelectorAll('.ad-card-slot').forEach(function (ad) { ad.remove(); });
              for (var i = wrappers.length - 1; i > 0; i -= 1) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = wrappers[i];
                wrappers[i] = wrappers[j];
                wrappers[j] = tmp;
              }
              wrappers.forEach(function (wrapper) { grid.appendChild(wrapper); });
              documentaryWrappers.forEach(function (wrapper) { grid.appendChild(wrapper); });
              wrappers.forEach(function (wrapper, index) {
                if ((index + 1) % 5 !== 0) return;
                var adSlot = document.createElement('div');
                adSlot.className = 'ad-card-slot';
                adSlot.setAttribute('aria-hidden', 'true');
                wrapper.insertAdjacentElement('afterend', adSlot);
              });`,
`              var wrappers = Array.prototype.slice.call(grid.querySelectorAll('.video-card-wrapper'));
              grid.querySelectorAll('.ad-card-slot').forEach(function (ad) { ad.remove(); });

              for (var i = wrappers.length - 1; i > 0; i -= 1) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = wrappers[i];
                wrappers[i] = wrappers[j];
                wrappers[j] = tmp;
              }

              wrappers.forEach(function (wrapper) { grid.appendChild(wrapper); });

              wrappers
                .filter(function (wrapper) { return wrapper.style.display !== 'none'; })
                .forEach(function (wrapper, index) {
                  if ((index + 1) % 5 !== 0) return;
                  var adSlot = document.createElement('div');
                  adSlot.className = 'ad-card-slot';
                  adSlot.setAttribute('aria-hidden', 'true');
                  wrapper.insertAdjacentElement('afterend', adSlot);
                });`,
'Category shuffle'
);

replaceExact(
`        const initialSearch = new URLSearchParams(window.location.search).get('q');
        if (searchInput instanceof HTMLInputElement && initialSearch) {
          searchInput.value = initialSearch;
        }
        if (!chips.length && !videoCards.length) return;
        let currentCategory = 'All';
        let refreshMobilePreview = null;`,
`        const searchParams = new URLSearchParams(window.location.search);
        const initialSearch = searchParams.get('q');
        const requestedCategory = searchParams.get('category');

        if (searchInput instanceof HTMLInputElement && initialSearch) {
          searchInput.value = initialSearch;
        }

        if (!chips.length && !videoCards.length) return;

        const availableCategories = new Set(
          Array.from(chips).map(
            chip => chip.getAttribute('data-category-target') || 'All'
          )
        );

        let currentCategory =
          requestedCategory && availableCategories.has(requestedCategory)
            ? requestedCategory
            : 'All';

        chips.forEach(chip => {
          const category =
            chip.getAttribute('data-category-target') || 'All';

          chip.classList.toggle(
            'active',
            category === currentCategory
          );
        });

        let refreshMobilePreview = null;`,
'Category restoration'
);

replaceExact(
`            currentCategory =
              chip.getAttribute('data-category-target') || 'All';
            filterVideos();`,
`            currentCategory =
              chip.getAttribute('data-category-target') || 'All';

            const categoryUrl = new URL(window.location.href);

            if (currentCategory === 'All') {
              categoryUrl.searchParams.delete('category');
            } else {
              categoryUrl.searchParams.set(
                'category',
                currentCategory
              );
            }

            window.history.replaceState(
              {},
              '',
              categoryUrl.pathname +
                categoryUrl.search +
                categoryUrl.hash
            );

            filterVideos();`,
'Category persistence'
);

replaceExact(
`        // The initial grid and ad slots are already rendered by Astro.
        // Only apply client-side filtering on load when a URL search query exists.
        if (initialSearch) {
          filterVideos();
        }`,
`        // Apply the selected category and search state on every page load.
        filterVideos();`,
'Initial filtering'
);

if (
  source.includes('documentaryWrappers') ||
  !source.includes("searchParams.get('category')") ||
  !source.includes("categoryUrl.searchParams.set(")
) {
  throw new Error('Final verification failed. File was not changed.');
}

const backup =
  `${file}.before-category-final-${Date.now()}.bak`;

fs.copyFileSync(file, backup);
fs.writeFileSync(file, source, 'utf8');

console.log(`Updated: ${file}`);
console.log(`Original lines: ${original.split('\n').length}`);
console.log(`Updated lines: ${source.split('\n').length}`);
console.log(`Backup: ${backup}`);
console.log('Category persistence: OK');
console.log('Documentary shuffle: OK');
