const URL = 'http://localhost:3000/api/students';

//Функция вывода одного студента в таблицу
function getStudentObj(studentObj){
    return {
        id: studentObj.id,
        name: `${
                studentObj.surname
            } ${
                studentObj.name
            } ${
                studentObj.lastname
        }`,
        faculty: `${studentObj.faculty}`,
        dateOfBirth: `${
                dateToFormat(new Date(studentObj.birthday).getDate())
            }.${
                dateToFormat(new Date(studentObj.birthday).getMonth() + 1)
            }.${
                new Date(studentObj.birthday).getFullYear()
            } (${
                formDateBirth(studentObj.birthday)
        })`,
        trainingTime: `${
                studentObj.studyStart
            }-${
                +studentObj.studyStart + 4
            } (${
                formDateTraining(studentObj.studyStart)
        })`,
    }; 
}

 //формат даты
 function dateToFormat(date){
    if(`${date}`.length === 1){
        return `0${date}`;
    }
    return date;
}


//Форматирование лет обучения
function formDateTraining(dateStart){
    dateStart = new Date(`${dateStart}-10-1`);
    if((new Date().getFullYear() > dateStart.getFullYear() + 4)
        ||  ((new Date().getFullYear() === dateStart.getFullYear() + 4)
                && (new Date().getMonth() > 7)
        )){
        return 'закончил';
    } else{
        let course = new Date().getFullYear() - dateStart.getFullYear();
        if(new Date().getMonth() > 7){
            course += 1 
        }
        return course + ' курс';
    }
}

//Форматирование даты рождения
function formDateBirth(date){
    date = new Date(date);
    const dateNow = new Date();
    let year;
    if(dateNow.getMonth() > date.getMonth() 
        || (dateNow.getMonth() === date.getMonth() 
            && dateNow.getDate() > date.getDate()))
            {
                year = `${dateNow.getFullYear() - date.getFullYear()}`;
    } else{
        year = `${dateNow.getFullYear() - date.getFullYear() - 1}`;
    }

    let lastSymbolYear = year[year.length - 1];
    switch(lastSymbolYear){
        case '1':
        case '2':
        case '3':
        case '4':
            if(year[year.length - 2] !== 1){
                if(lastSymbolYear === '1'){
                    year += ' год';
                    break;
                }
                year += ' года';
                break;
            } 
        default:
            year += ' лет';
    };
    return year;
}  

//Удаление записи о студенте
async function deleteStudentItem(studentItem){
    if (confirm('Вы точно хотите удалить запись?')){
        await fetch(`${URL}/${studentItem.id}`,{
            method: 'DELETE',
        });
        document.getElementById(`${studentItem.id}`).remove();
        delete studentItem;
    }
}

// Вывод одного студента
function getStudentItem(studentObj) {
    const tr = document.createElement('tr');
    tr.id = `${studentObj.id}`;
    Object.keys(studentObj).forEach(studentParam =>{
        if(studentParam != 'id'){
            const td = document.createElement('td');
            td.textContent = studentObj[studentParam];
            tr.append(td);
        }
    });

    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-danger';
    btn.textContent = 'X'
    btn.addEventListener('click', ()=>{deleteStudentItem(tr)})
    tr.append(btn)
    return tr; 
}

// Сортировка элементов
function sortingElements(sortArr){
    const titleColArr = document.querySelectorAll('.table-col__title');
    titleColArr.forEach((titleCol, index) => {
        
        let nameCol;
        switch(index){
            case 0:
                nameCol = 'name';
                break;
            case 1:
                nameCol = 'faculty';
                break;
            case 2:
                nameCol = 'dateOfBirth';
                break;
            case 3:
                nameCol = 'trainingTime';
                break;
        }

        //Форматирование даты для сортировки
        function normalizeDate(element){
            let el = element.split('');
            el.splice(10, el.length);
            [el[0], el[1], el[3], el[4]] = [el[3], el[4], el[0], el[1]];
            element = new Date (el.join(''));
            return element;
        }
        
        if(titleCol.classList.contains('sort--up') || titleCol.classList.contains('sort--down')){
            sortArr.sort((prevElem, nextElem) => {
                let prev = prevElem[nameCol];
                let next = nextElem[nameCol];
                if (index === 2) {
                    prev = normalizeDate(prevElem[nameCol]);
                    next = normalizeDate(nextElem[nameCol]);
                }

                if (titleCol.classList.contains('sort--up')){
                    if(prev > next) return 1;
                    if(prev == next) return 0;
                    if(prev < next) return -1;
                } else {
                    if(prev < next) return 1;
                    if(prev == next) return 0;
                    if(prev > next) return -1;
                }   
            });
        };
    });
    return sortArr;
}

//Функция отрисовки всех студентов
function renderStudentsTable(studentsArray) {
    const tbody = document.querySelector('.student-table');
    tbody.innerHTML ='';
    if(studentsArray.length > 0){
        const sortArr = [];
        studentsArray.forEach(studentObj => {
            sortArr.push(getStudentObj(studentObj));
        })

        sortingElements(sortArr)
            .forEach(item =>{
                tbody.append(getStudentItem(item)); 
            });
    } else{
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4">Ничего не найдено</td>'
        tbody.append(tr);
    }
}

let filterElementId = 0;

function createInput(name, type = 'text'){
    const input = document.createElement('input');
    const label = document.createElement('label');
    if(Array.isArray(type)){
        type.forEach((item, index, arr)=>{
            index % 2 === 0
                ? (
                    input.setAttribute(item, arr[index+1])
                  )
                :false;
        });
    }else{
        input.setAttribute('type', type);
    }
    input.setAttribute('placeholder', name);
    input.className = 'form-control col';
    input.id = `form__input-${filterElementId++}`;
    label.className = 'form-label';
    label.textContent = name;
    label.setAttribute('for', input.id);
    label.style.cssText = "position: absolute; top: -25px; left: 10px;"
    return {input, label};
}

async function filtration(filterValue = ''){
    const studentsArray = await fetch(`${URL}?search=${filterValue}`);
    return await studentsArray.json();
}

let filterValue = '';
let timeId
function onFilterInput(input){
    clearTimeout(timeId)
    timeId = setTimeout(async ()=>{
        filterValue = input.target.value.trim();
        renderStudentsTable(await filtration(filterValue));
    }, 300)
}


function createFilterForm(arrItems){
    const form = document.createElement('form');
    form.className = `filter__form form row row-cols-${Math.round(arrItems.length / 2)} mb-3`;
    const inputArrId = [];
    
    const inputForm = createInput(arrItems[0], arrItems[1]);
    inputForm.input.addEventListener('input', onFilterInput);
    inputArrId.push(inputForm.input.id);

    const div = document.createElement('div');
    div.style.position = 'relative';
    div.append(inputForm.input);
    div.append(inputForm.label);
    form.append(div);

    return form;
}



function createTable(titlesTable){
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');

    tbody.className = 'student-table';
    table.className = 'table caption-top mb-5';
    table.style.boxShadow = `
        0 1px 4px rgba(0, 0, 0, 1),
        -23px 0 20px -23px rgba(0, 0, 0, .8),
        23px 0 20px -23px rgba(0, 0, 0, .8),
        0 0 40px rgba(0, 0, 0, .1) inset
    `
    titlesTable.forEach((item)=>{
        const th = document.createElement('th');
        th.className = 'table-col__title'
        th.textContent = item;
        th.addEventListener('click', async event =>{
            const th = event.target;
            let checkTh;
            
            th.classList.contains('sort--up')
                ? checkTh = 2
                : th.classList.contains('sort--down')
                    ? checkTh = 0
                    : checkTh = 1;
            document.querySelectorAll('.table-col__title')
                .forEach((thItem) => {
                    thItem.className = 'table-col__title';
                });
            switch (checkTh){
                case 0:
                    th.classList.add('sort--up');
                    break;
                case 1:
                    th.classList.add('sort--down');
            }
            renderStudentsTable(await filtration(filterValue));
        })
        tr.append(th);
    });
    thead.append(tr);
    table.append(thead);
    table.append(tbody);
    return table;
}

//Создание нового студента
async function addStudentList(inputArrId){
    const student = {};
    const parameters = ['surname', 'name', 'lastname', 'faculty', 'birthday', 'studyStart']
    inputArrId.forEach((item, index)=>{
        const input = document.getElementById(item);
        if(index === 4){
            student[parameters[index]] = new Date(input.value).toISOString();
            input.value = ''
        }else{
            student[parameters[index]] = `${input.value}`.charAt(0).toUpperCase() + `${input.value}`.slice(1).toLowerCase();
            input.value = '';
        }
    });
    const response = await fetch(`${URL}`,{ 
        method: 'POST',
        body: JSON.stringify(student),
        headers:{
            'Content-Type': 'application/json',
        }  
    })

    //Чтобы не перерисовывать всю таблицу, добовляем элемент в конец
    const tbody = document.querySelector('.student-table');
    tbody.append(getStudentItem(getStudentObj(await response.json())));
}

function createAddStudentButton(textButton, inputArrId){
    const button = document.createElement('button');
    button.type='submit';
    button.className='btn btn-primary col';
    button.textContent = textButton;
    return button;
}

function createAddStudentForm(arrItems){
    const form = document.createElement('form');
    form.className = `add-student__form form row row-cols-${Math.round(arrItems.length / 2)} mb-3`;
    const inputArrId = [];
    arrItems.forEach((item, index, arr) => {
        if (index % 2 === 0){
            const inputForm = createInput(item, arr[index+1]);
            inputArrId.push(inputForm.input.id);
            if(index < 8){
                inputForm.input.addEventListener('input', () =>{
                    inputForm.input.value = inputForm.input.value.trim()
                });
            }
            const div = document.createElement('div');
            div.style.position = 'relative';
            div.classList.add('mb-4');
            div.append(inputForm.input);
            div.append(inputForm.label);
            form.append(div);
        }
    });

    const button = createAddStudentButton('Добавить', inputArrId)
    form.append(button);
    form.addEventListener('submit', event => {
        event.preventDefault(); 
        addStudentList(inputArrId);
    });
    return form;
}

document.addEventListener('DOMContentLoaded', async()=>{
    const container = document.querySelector('.container');
    //Создание фильтра
    container.prepend(createFilterForm(
        [
            'Фильтровать','text',
        ]
    ));
    //Создание таблицы
    container.append(createTable(
        [
            'Ф.И.О',
            'Факультет',
            'Дата рождения и возраст',
            'Годы обучения'
        ]
    ));
    //Создание формы добавления студентов
    container.append(createAddStudentForm(
        [
            'Фaмилия', ['type', 'text', 'required', ''],
            'Имя', ['type', 'text', 'required', ''],
            'Отчество', ['type', 'text', 'required', ''],
            'Факультет', ['type', 'text', 'required', ''], 
            'Дата рождения', ['type', 'date', 'required', '', 'min', '1900-01-01', 'max', `${new Date().toISOString().split('T')[0]}`],
            'Год начала обучения',['type', 'number', 'required', '', 'min', '2000', 'max', `${new Date().getFullYear()}`],
        ]
    ));

    //Добавление элементов с сервера в таблицу
    renderStudentsTable(await (async()=>{
        const response = await fetch(`${URL}`);  
        return await response.json()
    })())
})