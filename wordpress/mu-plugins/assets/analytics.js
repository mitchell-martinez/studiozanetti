(() => {
	'use strict';

	const dashboard = document.querySelector('.sz-analytics-overview');
	if (!dashboard) return;

	const nav = dashboard.querySelector('.sz-analytics-nav');
	if (!nav) return;
	const tabs = Array.from(nav.querySelectorAll('a[href^="#"]'));
	const panels = tabs.map((tab) => dashboard.querySelector(tab.getAttribute('href')));
	if (!tabs.length || panels.some((panel) => !panel)) return;

	nav.setAttribute('role', 'tablist');
	tabs.forEach((tab, index) => {
		tab.id = `sz-analytics-tab-${panels[index].id}`;
		tab.setAttribute('role', 'tab');
		tab.setAttribute('aria-controls', panels[index].id);
		panels[index].setAttribute('role', 'tabpanel');
		panels[index].setAttribute('aria-labelledby', tab.id);
		panels[index].tabIndex = 0;
	});

	function activate(index) {
		tabs.forEach((tab, position) => {
			const active = position === index;
			tab.setAttribute('aria-selected', String(active));
			tab.tabIndex = active ? 0 : -1;
			panels[position].hidden = !active;
		});

		// Reveal the active tab horizontally without moving the page vertically.
		const tabBounds = tabs[index].getBoundingClientRect();
		const navBounds = nav.getBoundingClientRect();
		if (tabBounds.left < navBounds.left) nav.scrollLeft += tabBounds.left - navBounds.left - 6;
		else if (tabBounds.right > navBounds.right) nav.scrollLeft += tabBounds.right - navBounds.right + 6;

		// Keep the selected report when a date range reloads the dashboard.
		const hash = tabs[index].getAttribute('href');
		const form = dashboard.querySelector('.sz-analytics-range');
		if (form) form.setAttribute('action', window.location.pathname + hash);
		dashboard.querySelectorAll('.sz-analytics-presets a').forEach((link) => {
			const url = new URL(link.href);
			url.hash = hash;
			link.href = url.href;
		});
	}

	function activateFromHash() {
		const index = tabs.findIndex((tab) => tab.hash === window.location.hash);
		activate(index < 0 ? 0 : index);
	}

	tabs.forEach((tab, index) => {
		tab.addEventListener('click', (event) => {
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			event.preventDefault();
			if (window.location.hash !== tab.hash) window.history.pushState(null, '', tab.hash);
			activate(index);
		});

		tab.addEventListener('keydown', (event) => {
			let next;
			if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
			else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
			else if (event.key === 'Home') next = 0;
			else if (event.key === 'End') next = tabs.length - 1;
			else return;

			event.preventDefault();
			window.history.replaceState(null, '', tabs[next].hash);
			activate(next);
			tabs[next].focus();
		});
	});

	window.addEventListener('hashchange', activateFromHash);
	window.addEventListener('popstate', activateFromHash);
	activateFromHash();
})();
