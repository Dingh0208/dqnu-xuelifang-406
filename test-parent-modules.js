// Small standalone smoke test for the parent API contract and route wiring.
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = __dirname
const routes = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8')).pages.map(item => item.path)
;['home', 'report', 'children', 'profile'].forEach(page => {
	const route = 'pages/parent/' + page
	assert(routes.includes(route), 'missing route: ' + route)
	const filename = path.join(root, route + '.vue')
	assert(fs.existsSync(filename), 'missing page file: ' + route)
	const source = fs.readFileSync(filename, 'utf8')
	const template = source.split('<script>')[0]
	const tags = template.match(/<\/?([A-Za-z][\w-]*)/g) || []
	tags.forEach(tag => assert(['template', 'view', 'text', 'scroll-view', 'input', 'ParentTopSpace', 'ParentTabBar'].includes(tag.replace(/[</]/g, '')), 'unsupported template tag in ' + route + ': ' + tag))
	const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
		.replace(/^import .*\r?\n/gm, '')
		.replace('export default', 'var page =')
	new (require('vm').Script)(script, { filename })
	const imports = source.matchAll(/from\s+['"]@\/([^'"]+)['"]/g)
	for (const item of imports) assert(fs.existsSync(path.join(root, item[1])), 'unresolved import in ' + route + ': ' + item[1])
})

const authSource = fs.readFileSync(path.join(root, 'api/auth.js'), 'utf8')
assert(authSource.includes('export function requireParent()'), 'parent page role guard is missing')
assert(authSource.includes("parent: '/pages/parent/home'"), 'parent login target is missing')

const tabBarSource = fs.readFileSync(path.join(root, 'components/parent/ParentTabBar.vue'), 'utf8')
assert(/\.parent-tabbar\s*\{[^}]*position:\s*relative;[^}]*flex-shrink:\s*0;/.test(tabBarSource), 'parent tab bar must reserve space in page layout')
assert(!/\.parent-tabbar\s*\{[^}]*position:\s*fixed;/.test(tabBarSource), 'parent tab bar must not be overlaid by the scroll view')
const topSpaceSource = fs.readFileSync(path.join(root, 'components/parent/ParentTopSpace.vue'), 'utf8')
assert(topSpaceSource.includes('getMenuButtonBoundingClientRect'), 'parent top space must align content below the native capsule')
assert(topSpaceSource.includes('statusBarHeight + (88 * rpxToPx)'), 'parent top space must have a status-bar fallback')
const reportPage = fs.readFileSync(path.join(root, 'pages/parent/report.vue'), 'utf8')
assert(!/\.hero-card\s*\{[^}]*min-height:\s*620rpx/.test(reportPage), 'weekly report card must size to its content')
for (const page of ['home', 'report', 'children', 'profile']) {
	const source = fs.readFileSync(path.join(root, 'pages/parent/' + page + '.vue'), 'utf8')
	assert(/\.scroll\s*\{[^}]*flex:\s*1;[^}]*height:\s*0;[^}]*min-height:\s*0;/.test(source), page + ' scroll view must shrink so the bottom tab bar remains visible')
	assert(source.includes('.bottom-space { height: 24rpx; }'), page + ' must not reserve fixed-tabbar-sized empty space')
}

const topSpaceScript = topSpaceSource.match(/<script>([\s\S]*?)<\/script>/)[1].replace('export default', 'var component =')
const capsuleRect = { top: 58, bottom: 92 }
const topSpaceContext = { uni: { getSystemInfoSync: () => ({ statusBarHeight: 44, windowWidth: 390 }) }, wx: { getMenuButtonBoundingClientRect: () => capsuleRect } }
new (require('vm').Script)(topSpaceScript + '\ncomponent', { filename: 'ParentTopSpace.vue' }).runInNewContext(topSpaceContext)
const topSpace = topSpaceContext.component.data()
topSpaceContext.component.methods.updateTopSpace.call(topSpace)
assert.strictEqual(topSpace.topSpaceStyle.height, '106px', 'top spacer must clear the capsule and its upper gap')
const fallbackContext = { uni: { getSystemInfoSync: () => ({ statusBarHeight: 24, windowWidth: 375 }) } }
new (require('vm').Script)(topSpaceScript + '\ncomponent', { filename: 'ParentTopSpace.vue' }).runInNewContext(fallbackContext)
const fallbackTopSpace = fallbackContext.component.data()
fallbackContext.component.methods.updateTopSpace.call(fallbackTopSpace)
assert.strictEqual(fallbackTopSpace.topSpaceStyle.height, '68px', 'top spacer fallback must include the status bar')

const chartSource = fs.readFileSync(path.join(root, 'utils/parentChart.js'), 'utf8').replace(/^export function /gm, 'function ')
const chart = new Function(chartSource + '\nreturn { getParentChartPointStyle, getParentChartLineStyle }')()
;
[
	{ values: [22, 30, 26, 42, 38, 56, 52, 72], size: { width: 240, height: 100 }, xOffset: 3, xStep: 12, yOffset: 82, yScale: -1 },
	{ values: [84, 87, 86, 89, 91], size: { width: 430, height: 94 }, xOffset: 5, xStep: 22, yOffset: 480, yScale: -5 }
].forEach(function (series) {
	series.values.slice(0, -1).forEach(function (value, index) {
		const startPoint = chart.getParentChartPointStyle(value, index, series.size, series.xOffset, series.xStep, series.yOffset, series.yScale)
		const endPoint = chart.getParentChartPointStyle(series.values[index + 1], index + 1, series.size, series.xOffset, series.xStep, series.yOffset, series.yScale)
		const segment = chart.getParentChartLineStyle(value, series.values[index + 1], index, series.size, series.xOffset, series.xStep, series.yOffset, series.yScale)
		const angle = Number(segment.transform.match(/rotate\(([-\d.]+)deg\)/)[1]) * Math.PI / 180
		const segmentWidth = Number(segment.width.replace('px', ''))
		assert.strictEqual(segment.left, startPoint.left, 'line should start at each chart point')
		assert.strictEqual(segment.top, startPoint.top, 'line should share each chart point y coordinate')
		assert(Math.abs(segmentWidth * Math.cos(angle) - (parseFloat(endPoint.left) - parseFloat(startPoint.left))) < 0.001, 'line should reach the next point horizontally')
		assert(Math.abs(segmentWidth * Math.sin(angle) - (parseFloat(endPoint.top) - parseFloat(startPoint.top))) < 0.001, 'WeChat-rendered line should reach every next point vertically')
	})
})

const mockSource = fs.readFileSync(path.join(root, 'mock/parent/dashboard.js'), 'utf8')
	.replace(/^export function /gm, 'function ')
const mock = new Function('uni', mockSource + '\nreturn { fetchHome, fetchWeeklyReport, fetchChildren, fetchChildDashboard, fetchParentProfile, createReminder, bindChild }')({
	getStorageSync: key => key === 'login_user_info' ? { nickname: '王女士' } : null
})

const apiSource = fs.readFileSync(path.join(root, 'api/parent/dashboard.js'), 'utf8')
	.replace(/^import .*\r?\n/gm, '')
	.replace(/^export function /gm, 'function ')
const apiFactory = new Function('USE_MOCK', 'request', 'mock', apiSource + '\nreturn { getParentHome, getWeeklyReport, getChildren, getChildDashboard, getParentProfile, createReminder, bindChild }')
const api = apiFactory(true, function () { throw new Error('Mock mode must not call request') }, mock)

async function run() {
	const home = await api.getParentHome('child-002')
	assert.strictEqual(home.code, 200)
	assert.strictEqual(home.data.child.id, 'child-002')
	assert.strictEqual((await api.getWeeklyReport('child-001', -1)).data.subjects.length, 3)
	assert.strictEqual((await api.getChildren()).data.children.length, 2)
	assert.strictEqual((await api.getChildDashboard('child-001')).data.progress.percent, 82)
	assert.strictEqual((await api.getParentProfile()).data.parent.name, '王女士')
	assert.strictEqual((await api.createReminder({ childId: 'child-001', text: '周六 15:00' })).code, 200)
	assert.strictEqual((await api.bindChild({ code: 'wrong-code' })).code, 404)

	const requests = []
	const remote = apiFactory(false, options => { requests.push(options); return Promise.resolve({ code: 200 }) }, mock)
	await remote.getParentHome('child-001')
	await remote.getWeeklyReport('child-001', 2)
	await remote.getChildren()
	await remote.getChildDashboard('child-001')
	await remote.getParentProfile()
	await remote.createReminder({ childId: 'child-001' })
	await remote.bindChild({ code: '20240408' })
	assert.deepStrictEqual(requests.map(item => item.url), [
		'/api/parent/home', '/api/parent/reports/weekly', '/api/parent/children',
		'/api/parent/children/child-001/dashboard', '/api/parent/profile',
		'/api/parent/reminders', '/api/parent/children/bind'
	])
	assert.strictEqual(requests[1].data.weekOffset, 2)
	assert.strictEqual(requests[5].method, 'POST')
	console.log('Parent routes, Mock data, and API contract passed.')
}

run().catch(error => { console.error(error); process.exitCode = 1 })
