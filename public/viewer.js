/**
 * In-page dialogs: the resume viewer and the project overviews.
 *
 * Every .viewer dialog closes from its [data-close] button or a click on the
 * backdrop. Links with data-viewer open the named dialog instead of
 * navigating, and a dialog's frame loads lazily on first open. Phones render
 * PDFs in frames poorly or not at all, so on narrow screens those links are
 * left to navigate.
 */

const inline = matchMedia('(width > 40rem)');

document.querySelectorAll('dialog.viewer').forEach((dialog) => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());

    // A click landing on the dialog itself, not its contents, hit the backdrop.
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
    });
});

document.querySelectorAll('a[data-viewer]').forEach((link) => {
    const dialog = document.getElementById(link.dataset.viewer);
    const frame = dialog.querySelector('iframe');

    link.addEventListener('click', (event) => {
        if (!inline.matches) return;

        event.preventDefault();
        if (!frame.src) frame.src = frame.dataset.src;
        dialog.showModal();
    });
});
