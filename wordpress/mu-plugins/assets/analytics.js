;(() => {
	'use strict'

	const dashboard = document.querySelector('.sz-analytics-overview')
	if (!dashboard) return

	const chart = dashboard.querySelector('.sz-traffic-chart')
	if (chart) {
		const controls = chart.querySelector('.sz-trend-controls')
		const tooltip = chart.querySelector('.sz-chart-tooltip')
		const plot = chart.querySelector('.sz-chart-plot')
		let metric = 'page_views'
		controls.hidden = false
		controls.querySelectorAll('button').forEach((button) => {
			button.addEventListener('click', () => {
				metric = button.dataset.metric
				controls.querySelectorAll('button').forEach((control) => {
					control.setAttribute('aria-pressed', String(control === button))
				})
				chart.querySelectorAll('.sz-trend-series').forEach((series) => {
					const active = series.dataset.metric === metric
					series.toggleAttribute('hidden', !active)
					if (active) {
						chart.querySelector('[data-chart-total]').textContent = series.dataset.total
						chart.querySelector('[data-chart-average]').textContent =
							`${series.dataset.average} per day`
					}
				})
				chart.querySelector('[data-chart-label]').textContent =
					`${button.textContent.toLowerCase()} in this period`
				chart.querySelector('#sz-traffic-chart-title').textContent =
					`Daily ${button.textContent.toLowerCase()}. Exact figures are available in the daily figures table.`
				tooltip.hidden = true
			})
		})
		chart.querySelectorAll('.sz-chart-hit').forEach((hit) => {
			hit.querySelector('title')?.remove()
			hit.addEventListener('pointerenter', () => {
				const value = metric === 'sessions' ? hit.dataset.sessions : hit.dataset.pageViews
				tooltip.textContent = `${hit.dataset.date} · ${value} ${metric === 'sessions' ? 'sessions' : 'views'}`
				tooltip.hidden = false
				const bounds = hit.getBoundingClientRect()
				const plotBounds = plot.getBoundingClientRect()
				const halfWidth = tooltip.offsetWidth / 2 + 6
				const center = bounds.left + bounds.width / 2 - plotBounds.left
				tooltip.style.left = `${Math.max(halfWidth, Math.min(plotBounds.width - halfWidth, center))}px`
			})
		})
		plot.addEventListener('pointerleave', () => {
			tooltip.hidden = true
		})
	}

	const datePicker = dashboard.querySelector('.sz-analytics-date-picker')
	if (datePicker) {
		dashboard.addEventListener('click', (event) => {
			if (!datePicker.contains(event.target)) datePicker.open = false
		})
		datePicker.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				datePicker.open = false
				datePicker.querySelector('summary').focus()
			}
		})
	}

	const nav = dashboard.querySelector('.sz-analytics-nav')
	if (!nav) return
	const tabs = Array.from(nav.querySelectorAll('a[href^="#"]'))
	const panels = tabs.map((tab) => dashboard.querySelector(tab.getAttribute('href')))
	if (!tabs.length || panels.some((panel) => !panel)) return

	nav.setAttribute('role', 'tablist')
	tabs.forEach((tab, index) => {
		tab.id = `sz-analytics-tab-${panels[index].id}`
		tab.setAttribute('role', 'tab')
		tab.setAttribute('aria-controls', panels[index].id)
		panels[index].setAttribute('role', 'tabpanel')
		panels[index].setAttribute('aria-labelledby', tab.id)
		panels[index].tabIndex = 0
	})

	function activate(index) {
		tabs.forEach((tab, position) => {
			const active = position === index
			tab.setAttribute('aria-selected', String(active))
			tab.tabIndex = active ? 0 : -1
			panels[position].hidden = !active
		})

		// Reveal the active tab horizontally without moving the page vertically.
		const tabBounds = tabs[index].getBoundingClientRect()
		const navBounds = nav.getBoundingClientRect()
		if (tabBounds.left < navBounds.left) nav.scrollLeft += tabBounds.left - navBounds.left - 6
		else if (tabBounds.right > navBounds.right)
			nav.scrollLeft += tabBounds.right - navBounds.right + 6

		// Keep the selected report when a date range reloads the dashboard.
		const hash = tabs[index].getAttribute('href')
		const form = dashboard.querySelector('.sz-analytics-range')
		if (form) form.setAttribute('action', window.location.pathname + hash)
		dashboard.querySelectorAll('.sz-analytics-presets a').forEach((link) => {
			const url = new URL(link.href)
			url.hash = hash
			link.href = url.href
		})
	}

	function activateFromHash() {
		const index = tabs.findIndex((tab) => tab.hash === window.location.hash)
		activate(index < 0 ? 0 : index)
	}

	tabs.forEach((tab, index) => {
		tab.addEventListener('click', (event) => {
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
				return
			event.preventDefault()
			if (window.location.hash !== tab.hash) window.history.pushState(null, '', tab.hash)
			activate(index)
		})

		tab.addEventListener('keydown', (event) => {
			let next
			if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
			else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length
			else if (event.key === 'Home') next = 0
			else if (event.key === 'End') next = tabs.length - 1
			else return

			event.preventDefault()
			window.history.replaceState(null, '', tabs[next].hash)
			activate(next)
			tabs[next].focus()
		})
	})

	window.addEventListener('hashchange', activateFromHash)
	window.addEventListener('popstate', activateFromHash)
	activateFromHash()
})()
