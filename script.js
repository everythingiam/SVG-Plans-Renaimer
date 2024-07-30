let tableArray = [];
let svgArray = [];
let processedSvgArray = [];
let unprocessedRoomNumbers = [];

const startBtn = document.getElementById('process-btn');
const exportBtn = document.getElementById('export-btn');
const svgInput = document.getElementById('svg-input');
const csvInput = document.getElementById('csv-input');
const statusElement = document.querySelector('.status');

// Информация о комнатах
let living = {}, room1 = {}, room2 = {}, bath = {}, bath2 = {}, dressing = {};
let roomType, corridorText, roomNumber, roomS = '';

// Выбор SVG файлов
svgInput.addEventListener('change', (e) => {
    svgArray = Array.from(e.target.files);
});

// Выбор CSV файла
csvInput.addEventListener('change', (e) => {
    let file = e.target.files[0];
    Papa.parse(file, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            tableArray = results.data;
        }
    });
});

// Старт
startBtn.addEventListener('click', () => {
    putValues();

    if (!roomType) {
        console.error("roomType не определен.");
        return;
    }

    // Сортируем SVG файлы по имени (пока что сортировка бесполезна в этой версии кода)
    svgArray.sort((a, b) => a.name.localeCompare(b.name));
    processedSvgArray = [];
    unprocessedRoomNumbers = [];

    // Обрабатываем каждую строку таблицы
    tableArray.forEach((row, i) => {
        let found = false;
        if (!row.hasOwnProperty(roomType)) {
            console.error(`roomType "${roomType}" не найден в строке таблицы ${i}.`);
            return;
        }

        // Обрабатываем имя и ищем соответствующий SVG файл
        const transliteratedName = transliterateAndReplace(row[roomType], 'yes');
        const svgFile = svgArray.find(svg => transliterateAndReplace(svg.name) === transliteratedName);

        if (svgFile) {
            process(i, svgFile, row);
            found = true;
        }

        if (!found) {
            unprocessedRoomNumbers.push(row[roomNumber]);
        }
    });

    statusElement.textContent = "Все SVG файлы обработаны! Но скачивание ZIP займет какое-то время :(";
    exportBtn.style.display = 'block';

    console.log("Необработанные номера комнат:", unprocessedRoomNumbers);
});

// Обработка каждого SVG файла
function process(index, file, line) {
    let reader = new FileReader();

    reader.addEventListener('load', (e) => {
        let parser = new DOMParser();
        let doc = parser.parseFromString(e.target.result, "image/svg+xml");

        // Получаем элементы SVG по ID
        let elements = {
            living: doc.getElementById(living.svg),
            room1: doc.getElementById(room1.svg),
            room2: doc.getElementById(room2.svg),
            bath: doc.getElementById(bath.svg),
            bath2: doc.getElementById(bath2.svg),
            dressing: doc.getElementById(dressing.svg),
            corridor: doc.getElementById(corridorText),
            room: doc.getElementById(roomS)
        };

        // Обновляем текстовое содержимое элементов
        if (elements.living) elements.living.textContent = line[living.table];
        if (elements.room1) elements.room1.textContent = line[room1.table];
        if (elements.room) elements.room.textContent = line[room1.table];
        if (elements.room2) elements.room2.textContent = line[room2.table];
        if (elements.bath) elements.bath.textContent = line[bath.table];
        if (elements.bath2) elements.bath2.textContent = line[bath2.table];
        if (elements.dressing) elements.dressing.textContent = line[dressing.table];
        if (elements.corridor) elements.corridor.textContent = '';

        // Добавляем обработанный SVG файл в массив
        processedSvgArray.push({
            name: `${transliterateAndReplace(line[roomType], 'no')}-${line[roomNumber]}.svg`,
            content: new XMLSerializer().serializeToString(doc.documentElement)
        });
    });

    reader.readAsText(file);
}

// Транслитерация и замена символов в строке
function transliterateAndReplace(str, par) {
    const cyrillicToLatinMap = {
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ы': 'Y',
        'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya', 'Ь': '', 'Ъ': '',
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ы': 'y',
        'э': 'e', 'ю': 'yu', 'я': 'ya', 'ь': '', 'ъ': ''
    };

    let transliterated = str.split('').map(char => cyrillicToLatinMap[char] || (char === '/' ? '_' : char)).join('');
    return par === 'yes' ? `${transliterated}.svg` : transliterated;
}

// Экпорт ZIP
exportBtn.addEventListener('click', () => {
    let zip = new JSZip();
    processedSvgArray.forEach(svg => zip.file(svg.name, svg.content));

    zip.generateAsync({ type: 'blob' }).then(content => saveAs(content, 'processed_svgs.zip'));
});

// Получение значений из полей ввода и присвоения их соответствующим переменным
function putValues() {
    living = {
        table: document.querySelector('.living-room').value,
        svg: document.querySelector('.living-roomS').value
    };
    room1 = {
        table: document.querySelector('.room1').value,
        svg: document.querySelector('.room1S').value
    };
    room2 = {
        table: document.querySelector('.room2').value,
        svg: document.querySelector('.room2S').value
    };
    bath = {
        table: document.querySelector('.bath').value,
        svg: document.querySelector('.bathS').value
    };
    bath2 = {
        table: document.querySelector('.bath2').value,
        svg: document.querySelector('.bath2S').value
    };
    dressing = {
        table: document.querySelector('.dressing').value,
        svg: document.querySelector('.dressingS').value
    };
    roomNumber = document.querySelector('.roomNumber').value;
    corridorText = document.querySelector('.corridorS').value;
    roomType = document.querySelector('.roomType').value;
    roomS = document.querySelector('.room').value;
}
