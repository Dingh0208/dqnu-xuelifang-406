export function getParentChartPointStyle(value, index, size, xOffset, xStep, yOffset, yScale) {
	var x = xOffset + xStep * index
	var y = yOffset + Number(value || 0) * yScale
	return {
		left: size.width ? (size.width * x / 100) + 'px' : x + '%',
		top: size.height ? (size.height * y / 100) + 'px' : y + '%'
	}
}

export function getParentChartLineStyle(from, to, index, size, xOffset, xStep, yOffset, yScale) {
	var x = xOffset + xStep * index
	var startY = yOffset + Number(from || 0) * yScale
	var endY = yOffset + Number(to || 0) * yScale
	if (!size.width || !size.height) return { left: x + '%', top: startY + '%', width: '0px', transform: 'rotate(0deg)' }

	var dx = size.width * xStep / 100
	var dy = size.height * (endY - startY) / 100
	// CSS and mini-program view coordinates both increase downward on the Y axis.
	return {
		left: (size.width * x / 100) + 'px',
		top: (size.height * startY / 100) + 'px',
		width: Math.sqrt(dx * dx + dy * dy) + 'px',
		transform: 'rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI) + 'deg)',
		transformOrigin: 'left center'
	}
}
