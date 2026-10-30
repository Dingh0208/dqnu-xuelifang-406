<template>
	<view class="upload-row">
		<!-- 拍照上传 -->
		<view class="upload-card" @click="onCamera">
			<view class="upload-icon icon-camera"></view>
			<view class="upload-text">
				<text class="upload-title">拍照上传</text>
				<text class="upload-sub">拍摄错题</text>
			</view>
		</view>

		<!-- 固定间距 -->
		<view class="upload-gap"></view>

		<view class="upload-card" @click="onPaste">
			<view class="upload-icon icon-paste"></view>
			<view class="upload-text"><text class="upload-title">粘贴文字</text><text class="upload-sub">从剪贴板录入</text></view>
		</view>

		<view class="upload-gap"></view>

		<!-- 文档导入 -->
		<view class="upload-card" @click="onDocument">
			<view class="upload-icon icon-doc"></view>
			<view class="upload-text">
				<text class="upload-title">文档导入</text>
				<text class="upload-sub">导入题目</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'WrongBookUpload',
		methods: {
			// 拍照上传：未来调用 wx.chooseMedia / wx.chooseImage，再通过 uploadFile 发到后端
			// 当前阶段仅 Mock 触发，真正实现由父页面处理（避免组件层直接依赖 wx API）
			onCamera() {
				this.$emit('camera')
			},
			// 文档导入：未来调用 wx.chooseMessageFile，再上传
			onDocument() {
				this.$emit('document')
			},
			onPaste() { this.$emit('paste') }
		}
	}
</script>

<style>
	.upload-row {
		display: flex;
		align-items: stretch;
		margin-bottom: 0;
	}

	.upload-card {
		flex: 1;
		min-height: 132rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: var(--student-glass-12);
		border-radius: 26rpx;
		padding: 18rpx 12rpx;
	}

	.upload-gap {
		width: 24rpx;
		flex-shrink: 0;
	}

	.upload-icon {
		position: relative;
		width: 58rpx;
		height: 58rpx;
		border-radius: 18rpx;
		background-color: var(--student-glass-12);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 0;
		margin-bottom: 10rpx;
		flex-shrink: 0;
		color: #FFFFFF;
	}

	.icon-camera::before {
		content: '';
		width: 26rpx;
		height: 20rpx;
		border: 2rpx solid currentColor;
		border-radius: 6rpx;
		position: absolute;
		left: 15rpx;
		top: 20rpx;
	}

	.icon-camera::after {
		content: '';
		width: 8rpx;
		height: 8rpx;
		border: 2rpx solid currentColor;
		border-radius: 50%;
		position: absolute;
		left: 24rpx;
		top: 26rpx;
	}

	.icon-paste::before {
		content: '';
		width: 22rpx;
		height: 26rpx;
		border: 2rpx solid currentColor;
		border-radius: 4rpx;
		position: absolute;
		left: 18rpx;
		top: 16rpx;
	}

	.icon-paste::after {
		content: '';
		width: 12rpx;
		height: 5rpx;
		border: 2rpx solid currentColor;
		border-radius: 4rpx;
		position: absolute;
		left: 23rpx;
		top: 12rpx;
		background: #0A5C6A;
	}

	.icon-doc::before {
		content: '';
		width: 22rpx;
		height: 28rpx;
		border: 2rpx solid currentColor;
		border-radius: 3rpx;
		position: absolute;
		left: 18rpx;
		top: 14rpx;
	}

	.icon-doc::after {
		content: '';
		width: 12rpx;
		height: 2rpx;
		background: currentColor;
		box-shadow: 0 6rpx 0 currentColor, 0 12rpx 0 currentColor;
		position: absolute;
		left: 23rpx;
		top: 24rpx;
		opacity: 0.9;
	}

	.upload-text {
		flex: 1;
		min-width: 0;
	}

	.upload-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: var(--student-white);
		line-height: 1.3;
	}

	.upload-sub {
		display: block;
		font-size: 24rpx;
		color: var(--student-dark-copy);
		margin-top: 4rpx;
		font-size: 21rpx;
	}
</style>
