import axiosClient from '../../api/axiosClient.js'

// The reusable filter catalogue. A filter is defined once on the server and any widget
// references it by id, so "the list of doctors" has one definition rather than one per
// widget that happens to need it.
export function getFilterCatalogue() {
  return axiosClient.get('/widget-filters')
}

// The choices for one filter. `params` is the same flat bag a widget takes, so a list can
// narrow itself - a search term, a portfolio, whoever is logged in.
export function getFilterOptions(id, params = {}) {
  return axiosClient.post(`/widget-filters/${id}/options`, { pageSize: 200, ...params })
}
