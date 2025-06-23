/**
 * Sample data structure for activities
 * Excel file should have these column headers (Chinese or English):
 * 
 * Column Headers:
 * - 標題 / title: Activity title
 * - 內容 / content: Activity description
 * - 時間 / datetime: Activity date and time
 * - 地點 / location: Activity location
 * - 報名連結 / registerUrl: Registration form URL
 * - 影片連結 / videoUrl: Video embed URL (YouTube, Vimeo, etc.)
 */

// Sample Excel data structure
const sampleExcelData = [
    {
        "標題": "暑假一起 fun fun fun",
        "內容": "邀請你的朋友一起來吧！\n美食、遊戲、詩歌、信息、溫馨時光 …",
        "時間": "7/12、8/9 週六晚上 5:30 - 8:30",
        "地點": "新竹市慈雲路65號",
        "報名連結": "https://forms.gle/osPSFMpMHz2ZGf8D9",
        "影片連結": "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
        "標題": "青年敬拜夜",
        "內容": "一起在敬拜中經歷神的同在\n透過音樂與禱告親近主",
        "時間": "每週五晚上 7:00 - 9:00",
        "地點": "新竹市慈雲路65號",
        "報名連結": "https://forms.gle/example",
        "影片連結": "https://www.youtube.com/embed/dQw4w9WgXcQ"
    }
];

/**
 * How to use with actual Excel file:
 * 
 * 1. Place your Excel file in the same directory as web_activity.html
 * 2. Call loadExcelData('your-file.xlsx') in the browser console
 * 3. Or modify the loadActivities() function to load your specific file
 * 
 * Example usage:
 * loadExcelData('activities.xlsx');
 */

// Function to demonstrate Excel loading
function demonstrateExcelLoading() {
    console.log('Excel file format example:');
    console.table(sampleExcelData);
    console.log('\nTo load your Excel file, call: loadExcelData("your-file.xlsx")');
} 