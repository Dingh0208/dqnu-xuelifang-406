var ACTIVE_CHILD_KEY = 'parent_active_child_id'

export function getActiveChildId() {
	try { return uni.getStorageSync(ACTIVE_CHILD_KEY) || '' } catch (e) { return '' }
}

export function setActiveChildId(id) {
	try { if (id) uni.setStorageSync(ACTIVE_CHILD_KEY, id) } catch (e) {}
}
