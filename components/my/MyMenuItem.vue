<template>
	<view class="menu-item" :class="{ 'last-row': last }" @click="onClick">
		<text class="icon">{{ icon }}</text>
		<text class="label">{{ label }}</text>
		<!-- 可选右侧当前值（如「默认主题」）；不传时与普通菜单项完全一致 -->
		<text v-if="value" class="value">{{ value }}</text>
		<text class="arrow">›</text>
	</view>
</template>

<script>
	export default {
		name: 'MyMenuItem',
		props: {
			icon: { type: String, default: '' },
			label: { type: String, default: '' },
			// 可选：右侧当前值文本（如主题名）
			value: { type: String, default: '' },
			last: { type: Boolean, default: false }
		},
		methods: {
			onClick() {
				this.$emit('click')
			}
		}
	}
</script>

<style>
	.menu-item {
		display: flex;
		align-items: center;
		padding: 28rpx 0;
		border-bottom: 1rpx solid #EFE3D0;
	}

	.menu-item.last-row {
		border-bottom: none;
	}

	.icon {
		font-size: 34rpx;
		line-height: 1;
	}

	.label {
		flex: 1;
		margin-left: 18rpx;
		font-size: 29rpx;
		color: #4A3520;
	}

	.value {
		font-size: 25rpx;
		color: #B49D82;
		margin-right: 12rpx;
	}

	.arrow {
		font-size: 34rpx;
		color: #C6B092;
	}
</style>
