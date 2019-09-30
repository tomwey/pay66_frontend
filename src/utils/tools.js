import FileSaver from 'file-saver'
import XLSX from 'xlsx'

export function export2excel(tableID, fileName = null) {
    fileName = fileName || (dateFormat(new Date()) + '.xlsx');

    var fix = document.querySelector('.el-table__fixed') ||
        document.querySelector('.el-table__fixed-right') ||
        document.querySelector('.el-table__fixed-left');
    var wb;
    if (fix) {
        wb = XLSX.utils.table_to_book(document.querySelector(tableID).removeChild(fix));
        document.querySelector(tableID).appendChild(fix);
    } else {
        wb = XLSX.utils.table_to_book(document.querySelector(tableID))
    }
    /* get binary string as output */
    var wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'array' })
    try {
        FileSaver.saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName)
    } catch (e) { if (typeof console !== 'undefined') console.log(e, wbout) }
    return wbout
}

export function dateFormat(date, sFormat = "yyyy-MM-dd") {
    let time = {
        Year: 0,
        TYear: "0",
        Month: 0,
        TMonth: "0",
        Day: 0,
        TDay: "0",
        Hour: 0,
        THour: "0",
        hour: 0,
        Thour: "0",
        Minute: 0,
        TMinute: "0",
        Second: 0,
        TSecond: "0",
        Millisecond: 0
    };
    time.Year = date.getFullYear();
    time.TYear = String(time.Year).substr(2);
    time.Month = date.getMonth() + 1;
    time.TMonth = time.Month < 10 ? "0" + time.Month : String(time.Month);
    time.Day = date.getDate();
    time.TDay = time.Day < 10 ? "0" + time.Day : String(time.Day);
    time.Hour = date.getHours();
    time.THour = time.Hour < 10 ? "0" + time.Hour : String(time.Hour);
    time.hour = time.Hour < 13 ? time.Hour : time.Hour - 12;
    time.Thour = time.hour < 10 ? "0" + time.hour : String(time.hour);
    time.Minute = date.getMinutes();
    time.TMinute = time.Minute < 10 ? "0" + time.Minute : String(time.Minute);
    time.Second = date.getSeconds();
    time.TSecond = time.Second < 10 ? "0" + time.Second : String(time.Second);
    time.Millisecond = date.getMilliseconds();

    return sFormat
        .replace(/yyyy/gi, String(time.Year))
        .replace(/yyy/gi, String(time.Year))
        .replace(/yy/gi, time.TYear)
        .replace(/y/gi, time.TYear)
        .replace(/MM/g, time.TMonth)
        .replace(/M/g, String(time.Month))
        .replace(/dd/gi, time.TDay)
        .replace(/d/gi, String(time.Day))
        .replace(/HH/g, time.THour)
        .replace(/H/g, String(time.Hour))
        .replace(/hh/g, time.Thour)
        .replace(/h/g, String(time.hour))
        .replace(/mm/g, time.TMinute)
        .replace(/m/g, String(time.Minute))
        .replace(/ss/gi, time.TSecond)
        .replace(/s/gi, String(time.Second))
        .replace(/fff/gi, String(time.Millisecond));
}

export function addDays(days) {
    let date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}