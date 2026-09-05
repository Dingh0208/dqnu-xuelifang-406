<template>
	<view class="q-card" @click="onClick">
		<!-- 错题照片区域（固定 16:9 比例） -->
		<view class="q-image-wrap">
			<image
				class="q-image"
				:src="item.imageUrl"
				mode="aspectFill"
				lazy-load
			/>
			<!-- 题目类型标签（右上角胶囊） -->
			<view class="q-type-badge">
				<text class="q-type-text">{{ typeLabel }}</text>
			</view>
		</view>

		<!-- 照片下方信息 -->
		<view class="q-info">
			<text class="q-subject">{{ item.subject }}</text>
			<text class="q-title">{{ item.title }}</text>
			<text class="q-point">知识点：{{ item.knowledgePoint }}</text>
			<view class="q-meta">
				<text class="q-time">{{ item.uploadedAt }}</text>
				<text class="q-source">{{ item.source === 'camera' ? '拍照上传' : '文档导入' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { getQuestionTypeLabel } from '@/api/wrongbook.js'

	export default {
		name: 'WrongQuestionCard',
		props: {
			item: {
				type: Object,
				default: function () {
					return {}
				}
			}
		},
		computed: {
			typeLabel() {
				return getQuestionTypeLabel(this.item.questionType)
			}
		},
		methods: {
			onClick() {
				this.$emit('click', this.item)
			}
		}
	}
</script>

<style>
	.q-card {
		background-color: #FFFDF8;
		border-radius: 24rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 14rpx rgba(181, 106, 60, 0.06);
		/* 填满 Grid 单元格，同一行两张卡片高度一致；内部纵向 flex 让信息区自适应剩余空间 */
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.q-image-wrap {
		position: relative;
		width: 100%;
		/* 接近 1:1 比例，适配两列 Grid 卡片宽度（约 341rpx） */
		height: 340rpx;
		overflow: hidden;
	}

	.q-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	/* 题目类型标签：右上角半透明暖色胶囊 */
	.q-type-badge {
		position: absolute;
		top: 16rpx;
		right: 16rpx;
		padding: 8rpx 18rpx;
		border-radius: 999rpx;
		background-color: rgba(181, 106, 60, 0.78);
	}

	.q-type-text {
		font-size: 22rpx;
		color: #FFFDF8;
		line-height: 1.2;
	}

	.q-info {
		padding: 24rpx 26rpx 26rpx;
		flex: 1;
		min-width: 0;
	}

	.q-subject {
		display: block;
		font-size: 24rpx;
		color: #B56A3C;
		font-weight: 500;
	}

	.q-title {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 30rpx;
		color: #4A3520;
		font-weight: 600;
		margin-top: 8rpx;
		line-height: 1.4;
	}

	.q-point {
		display: block;
		font-size: 24rpx;
		color: #8D7964;
		margin-top: 8rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.q-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 14rpx;
	}

	.q-time {
		font-size: 22rpx;
		color: #B49D82;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		min-width: 0;
	}

	.q-source {
		font-size: 22rpx;
		color: #B49D82;
		white-space: nowrap;
		flex-shrink: 0;
		margin-left: 16rpx;
	}
</style>
