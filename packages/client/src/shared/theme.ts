export default class Theme {
	static Blue1: string = "#3656F4";
	static Blue2: string = "#4161FF";
	static Blue3: string = "#6781FF";
	static Blue4: string = "#8DA0FF";
	static Blue5: string = "#B3C0FF";
	static Blue6: string = "#D9DFFF";
	static Blue7: string = "#ECEFFF";

	static Green1: string = "#5ECBA1";
	static Green2: string = "#7ED5B4";
	static Green3: string = "#9EE0C7";
	static Green4: string = "#BFEAD9";
	static Green5: string = "#DFF5EC";

	static Orange: string = "#f29e4c";

	static Yellow1: string = "#f1c453";
	static Yellow2: string = "#efea5a";

	static Error: string = "#f2654c";
	static Warning: string = "#f29e4c";
	static Message: string = "#0db371";
	static Success: string = "#37A626";

	static Background: string = "#F8F8F8";

	static Grey1: string = "#696969";
	static Grey2: string = "#807f7f";
	static Grey3: string = "#9f9f9f";
	static Grey4: string = "#bfbfbf";
	static Grey5: string = "#d7d7d7";
	static Silver: string = "#95A5A6";
	static LeftPanelBackground: string = "#263841";

	static FontName: string = "Roboto"; // "Roboto", "Segoe UI", "GeezaPro", "DejaVu Serif", serif
	static FontColor: string = "#696969";

	static Palette: string[] = [Theme.Blue1, Theme.Blue2, Theme.Blue3, Theme.Blue4, Theme.Orange, Theme.Green1, Theme.Green2, Theme.Yellow1, Theme.Yellow2];
	static DefaultEdgeColor = "#006D75";
	static CompanySvg = `<svg width="50" height="50"   fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M12 7V5C12 3.9 11.1 3 10 3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM19 19H12V17H14V15H12V13H14V11H12V9H19C19.55 9 20 9.45 20 10V18C20 18.55 19.55 19 19 19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z" fill="#050C42"/></g></svg>`;
	static IndividualSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#050C42"/></svg>`;
	static TrustSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.00003 5V5.38C8.17003 5.05 7.28003 4.88 6.39003 4.88C4.97003 4.88 3.55003 5.31 2.34003 6.17C1.83003 6.53 1.77003 7.26 2.21003 7.7L4.78003 10.27H5.89003V11.38C6.75003 12.24 7.87003 12.69 9.00003 12.74V15H7.00003C6.45003 15 6.00003 15.45 6.00003 16V18C6.00003 19.1 6.90003 20 8.00003 20H18C19.66 20 21 18.66 21 17V5C21 4.45 20.55 4 20 4H10C9.45003 4 9.00003 4.45 9.00003 5ZM7.89003 10.41V8.26H5.61003L4.57003 7.22C5.14003 7 5.76003 6.88 6.39003 6.88C7.73003 6.88 8.98003 7.4 9.93003 8.34L11.34 9.75L11.14 9.95C10.63 10.46 9.95003 10.75 9.22003 10.75C8.75003 10.75 8.29003 10.63 7.89003 10.41ZM19 17C19 17.55 18.55 18 18 18C17.45 18 17 17.55 17 17V16C17 15.45 16.55 15 16 15H11V12.41C11.57 12.18 12.1 11.84 12.56 11.38L12.76 11.18L15.59 14H17V12.59L11 6.62V6H19V17Z" fill="#050C42"/></svg>`;
	static AssetSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.4831 18.8512V19.5037C13.4831 20.325 12.809 21 11.9888 21H11.9775C11.1573 21 10.4831 20.325 10.4831 19.5037V18.8287C8.98876 18.5138 7.66292 17.6925 7.10112 16.3088C6.8427 15.69 7.32584 15.0037 8 15.0037H8.26966C8.68539 15.0037 9.02247 15.285 9.17977 15.6788C9.50562 16.5225 10.3596 17.1075 12 17.1075C14.2022 17.1075 14.6966 16.005 14.6966 15.3187C14.6966 14.385 14.2022 13.5075 11.6966 12.9113C8.91011 12.2363 7 11.0887 7 8.7825C7 6.8475 8.5618 5.5875 10.4944 5.17125V4.49625C10.4944 3.675 11.1685 3 11.9888 3H12C12.8202 3 13.4944 3.675 13.4944 4.49625V5.19375C15.0449 5.57625 16.0225 6.54375 16.4494 7.73625C16.6742 8.355 16.2022 9.0075 15.5393 9.0075H15.2472C14.8315 9.0075 14.4944 8.715 14.382 8.31C14.1236 7.455 13.4157 6.90375 12 6.90375C10.3146 6.90375 9.30337 7.66875 9.30337 8.74875C9.30337 9.69375 10.0337 10.3125 12.3034 10.8975C14.573 11.4825 17 12.4613 17 15.2963C16.9775 17.355 15.4382 18.48 13.4831 18.8512Z" fill="#050C42"/></svg>`;
	static ProjectSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17ZM19.5 19.1H4.5V5H19.5V19.1ZM19.5 3H4.5C3.4 3 2.5 3.9 2.5 5V19C2.5 20.1 3.4 21 4.5 21H19.5C20.6 21 21.5 20.1 21.5 19V5C21.5 3.9 20.6 3 19.5 3Z" fill="#050C42"/></svg>`;
	static CustomSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="2.5" width="8" height="8" rx="0.5" stroke="#050C42"/><rect x="13.5" y="2.5" width="8" height="8" rx="0.5" stroke="#050C42"/><rect x="13.5" y="13.5" width="8" height="8" rx="0.5" stroke="#050C42"/><rect x="2.5" y="13.5" width="8" height="8" rx="0.5" stroke="#050C42"/></svg>`;
}
