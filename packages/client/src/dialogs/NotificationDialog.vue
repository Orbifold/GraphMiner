<template>
	<v-snackbar style="z-index: 10000" centered v-model="isNotificationVisible" :timeout="notificationTimeout" :color="notificationColor">
		<v-row>
			<v-col cols="12" md="1" sm="1" lg="1">
				<v-icon style="vertical-align: center" :style="iconStyle">{{ notificationIcon }}</v-icon>
			</v-col>
			<v-col cols="12" md="11" sm="11" lg="11">
				<p :style="textStyle" v-html="notificationText"></p>
			</v-col>
		</v-row>
	</v-snackbar>
</template>

<script lang="ts">
	import { Component, Vue } from "vue-property-decorator";

	import Theme from "@/shared/theme";
	import { NotificationType } from "@/shared/notificationType";

	@Component({})
	export default class NotificationDialog extends Vue {
		isNotificationVisible: boolean = false;
		notificationText: string = null;
		notificationTimeout: number = 2000;
		notificationColor: string = null;
		notificationIcon: string = null;
		textStyle: any = { color: "white" };
		iconStyle: any = { color: "white" };

		/**
		 * Displays a notification.
		 * @param text {string} The text to display.
		 * @param [timeout] {number} The timeout in milliseconds. Default is 2000.
		 * @param [notificationType] {NotificationType} The kind of message to show.
		 */
		public notify(text: string, notificationType: NotificationType = NotificationType.Message, timeout: number = 2000) {
			this.notificationText = text;
			this.notificationTimeout = timeout;

			switch (notificationType) {
				case NotificationType.Message:
					this.notificationColor = Theme.Message;
					this.textStyle = { color: "white" };
					this.iconStyle = { color: "white", "margin-right": "5px" };
					this.notificationIcon = "mdi-shield-check-outline";
					break;
				case NotificationType.Clear:
					this.notificationColor = "#ffffff";
					this.textStyle = { color: "Dimgrey" };
					this.iconStyle = { color: "dimgrey", "margin-right": "5px" };
					this.notificationIcon = "mdi-shield-check-outline";
					break;
				case NotificationType.Warning:
					this.notificationColor = Theme.Warning;
					this.textStyle = { color: "white" };
					this.iconStyle = { color: "white", "margin-right": "5px" };
					this.notificationIcon = "mdi-shield-alert-outline";
					break;
				case NotificationType.Error:
					this.notificationColor = Theme.Error;
					this.textStyle = { color: "white" };
					this.iconStyle = { color: "white", "margin-right": "5px" };
					this.notificationIcon = "mdi-shield-star-outline";
					break;
			}

			this.isNotificationVisible = true;
		}
	}
</script>

<style scoped></style>
