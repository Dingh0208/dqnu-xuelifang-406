<template>
	<view class="upload-row">
		<!-- 拍照上传 -->
		<view class="upload-card" @click="onCamera">
			<view class="upload-icon">
				<text class="icon-text">📷</text>
			</view>
			<view class="upload-text">
				<text class="upload-title">拍照上传</text>
				<text class="upload-sub">拍摄错题</text>
			</view>
		</view>

		<!-- 固定间距 -->
		<view class="upload-gap"></view>

		<!-- 文档导入 -->
		<view class="upload-card" @click="onDocument">
			<view class="upload-icon">
				<text class="icon-text">📄</text>
			</view>
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
			}
		}
	}
</script>

<style>
	.upload-row {
		display: flex;
		align-items: stretch;
		margin-bottom: 24rpx;
	}

	.upload-card {
		flex: 1;
		display: flex;
		align-items: center;
		background-color: #FFFDF8;
		border-radius: 24rpx;
		padding: 28rpx 24rpx;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
	}

	.upload-gap {
		width: 24rpx;
		flex-shrink: 0;
	}

	.upload-icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background-color: #F6E3C8;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.icon-text {
		font-size: 36rpx;
		line-height: 1;
	}

	.upload-text {
		flex: 1;
		min-width: 0;
	}

	.upload-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: #4A3520;
		line-height: 1.3;
	}

	.upload-sub {
		display: block;
		font-size: 24rpx;
		color: #8D7964;
		margin-top: 6rpx;
	}
</style>
