/**
 * One-screen panel switcher.
 *
 * The URL hash names the visible panel (#rap-wizards), so every project has a
 * link that can be shared, and the browser's back button steps between them.
 * No hash shows the home panel. The picker, the arrows, and the keyboard's
 * left/right keys all just change the hash.
 */

const panels = [...document.querySelectorAll('.panel')];
const items = [...document.querySelectorAll('.picker__item')];
const ids = panels.map((panel) => panel.id);
const prevButton = document.querySelector('.stage__arrow--prev');
const nextButton = document.querySelector('.stage__arrow--next');

function current() {
    const id = location.hash.slice(1);
    return ids.includes(id) ? id : 'home';
}

function show() {
    const id = current();

    panels.forEach((panel) => { panel.hidden = panel.id !== id; });
    items.forEach((item) => {
        if (item.dataset.panel === id) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
    });

    const panel = document.getElementById(id);
    document.body.style.setProperty('--tint', panel.dataset.tint || 'transparent');
}

function go(step) {
    // Wraps around: next from the last panel goes back to the first.
    const next = ids[(ids.indexOf(current()) + step + ids.length) % ids.length];
    // Home has no hash; pushState keeps the URL clean instead of leaving "#".
    if (next === 'home') {
        history.pushState(null, '', location.pathname);
        show();
    } else {
        location.hash = next;
    }
}

prevButton.addEventListener('click', () => go(-1));
nextButton.addEventListener('click', () => go(1));

document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (document.querySelector('dialog[open]')) return;
    if (event.key === 'ArrowLeft') go(-1);
    if (event.key === 'ArrowRight') go(1);
});

// The home link is a bare "#"; route it through go() for the clean URL too.
document.querySelectorAll('a[href="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        if (current() !== 'home') {
            history.pushState(null, '', location.pathname);
            show();
        }
    });
});

addEventListener('hashchange', show);
addEventListener('popstate', show);
show();
