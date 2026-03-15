// import axios from 'axios';
function scrollToSection(i) {
	const section = document.querySelector(`.section[data-id="${i}"]`);
	const currentSection = document.querySelector('.section.selected');
	const quickButton = document.querySelector(`#nav button[data-id="${i}"]`);

	if (currentSection && currentSection.dataset.id == i) {
		return;
	}

	if (currentSection) {
		document.querySelector('#nav button.active').classList.remove('active');

		currentSection.classList.remove('selected');
		const overlay = document.createElement('div');
		overlay.onclick = () => {
			scrollToSection(currentSection.dataset.id);
		};
		overlay.classList.add('overlay');
		currentSection.appendChild(overlay);
	}

	let oldOverlay = section.querySelector('.overlay');
	if (oldOverlay) {
		oldOverlay.remove();
	}
	section.classList.add('selected');
	section.scrollIntoView({
		behavior: 'smooth',
		inline: 'center',
	});
	quickButton.classList.add('active');
}

let orignalX;
let moveButton;
let mouseX;
let scrollInt;
const scrollMargin = 50;
const maxScrollAmount = 20;
const minScrollAmount = 1;
function startMove(e, activeElement, parent) {
	// console.log(e);
	const button = activeElement;
	parent.classList.add('dragging-manual-parent');
	orignalX = e.target.getBoundingClientRect().left + e.target.offsetWidth / 2;
	button.style.left = `${e.clientX - orignalX}px`;
	moveButton = e.target;
	button.style.zIndex = 1000;
	button.classList.add('dragging-manual');
	document.addEventListener('mousemove', move);
	document.addEventListener('mouseup', stopMove);
}

function move(e) {
	const activeButton = document.querySelector('.dragging-manual');
	const parent = document.querySelector('.dragging-manual-parent');
	const dist = e.clientX - orignalX;
	mouseX = e.clientX;

	if (
		e.clientX >= parent.offsetLeft + parent.offsetWidth - scrollMargin &&
		parent.offsetWidth + parent.scrollLeft + maxScrollAmount <= parent.scrollWidth
	) {
		if (
			scrollInt !== undefined ||
			(activeButton.nextElementSibling.classList.contains('spacer') &&
				activeButton.nextElementSibling.getBoundingClientRect().right <
					parent.getBoundingClientRect().right)
		) {
			return;
		}
		scrollInt = setInterval(() => {
			if (parent.offsetWidth + parent.scrollLeft < parent.scrollWidth) {
				let scrollAmount = mapNumberRange(
					mapNumberRange(
						mouseX,
						0,
						parent.offsetLeft + parent.offsetWidth,
						parent.offsetLeft + parent.offsetWidth,
						0,
					),
					0,
					scrollMargin,
					maxScrollAmount,
					minScrollAmount,
				);
				parent.scrollLeft += scrollAmount;
				activeButton.style.left = `0px`;
				checkSwap(mouseX);
			} else {
				clearInterval(scrollInt);
				orignalX = moveButton.getBoundingClientRect().left + moveButton.offsetWidth / 2;
			}
		}, 20);
	} else if (e.clientX <= parent.offsetLeft + scrollMargin && parent.scrollLeft > 0) {
		if (scrollInt !== undefined) {
			return;
		}
		scrollInt = setInterval(() => {
			if (parent.scrollLeft > 0) {
				let scrollAmount = mapNumberRange(
					mouseX - parent.offsetLeft,
					0,
					scrollMargin,
					maxScrollAmount,
					minScrollAmount,
				);
				parent.scrollLeft -= scrollAmount;
				activeButton.style.left = `0px`;
				checkSwap(mouseX);
			} else {
				clearInterval(scrollInt);
				orignalX = moveButton.getBoundingClientRect().left + moveButton.offsetWidth / 2;
			}
		}, 20);
	} else {
		if (scrollInt) {
			clearInterval(scrollInt);
			scrollInt = undefined;
			orignalX = moveButton.getBoundingClientRect().left + moveButton.offsetWidth / 2;
		}
		// if (activeButton.nextElementSibling.classList.contains('spacer')) {
		// 	parent.scrollLeft = parent.scrollWidth;
		// }
		activeButton.style.left = `${dist}px`;

		checkSwap(e.clientX);
	}

	function checkSwap(mouseX) {
		if (
			activeButton.nextElementSibling &&
			activeButton.nextElementSibling.classList.contains('spacer') == false &&
			mouseX + parent.scrollLeft > activeButton.nextElementSibling.offsetLeft
		) {
			const nextElement = activeButton.nextElementSibling;
			// orignalX += nextElement.offsetWidth + 40;
			const nextNavButton = document.querySelector(
				`#nav button[data-id="${nextElement.dataset.id}"]`,
			);
			const currentNavButton = document.querySelector(
				`#nav button[data-id="${activeButton.dataset.id}"]`,
			);
			document.querySelector('#nav').insertBefore(nextNavButton, currentNavButton);
			nextElement.parentElement.insertBefore(nextElement, activeButton);
			activeButton.style.left = '0px';
			orignalX = moveButton.getBoundingClientRect().left + moveButton.offsetWidth / 2;
		} else if (
			activeButton.previousElementSibling &&
			activeButton.previousElementSibling.classList.contains('spacer') == false &&
			mouseX + parent.scrollLeft <
				activeButton.previousElementSibling.offsetLeft +
					activeButton.previousElementSibling.offsetWidth
		) {
			const previousElement = activeButton.previousElementSibling;
			const previousNavButton = document.querySelector(
				`#nav button[data-id="${previousElement.dataset.id}"]`,
			);
			const currentNavButton = document.querySelector(
				`#nav button[data-id="${activeButton.dataset.id}"]`,
			);
			document.querySelector('#nav').insertBefore(currentNavButton, previousNavButton);

			previousElement.parentElement.insertBefore(activeButton, previousElement);
			// orignalX -= previousElement.offsetWidth + 40;
			activeButton.style.left = '0px';
			orignalX = moveButton.getBoundingClientRect().left + moveButton.offsetWidth / 2;
		}
	}
}

function stopMove(e) {
	const transitionTime = 200;
	const activeButton = document.querySelector('.dragging-manual');
	const parent = document.querySelector('.dragging-manual-parent');
	const sections = parent.querySelectorAll('.section');
	const orderArray = [];
	sections.forEach((sect) => {
		orderArray.push(sect.dataset.id);
	});
	// console.log(sections);
	parent.classList.remove('dragging-manual-parent');
	scrollInt && clearInterval(scrollInt);
	scrollInt = undefined;
	document.removeEventListener('mousemove', move);
	document.removeEventListener('mouseup', stopMove);
	activeButton.style.left = '0px';
	activeButton.style.transition = `left ${transitionTime / 1000}s ease`;
	setTimeout(async () => {
		activeButton.style.transition = '';
		activeButton.scrollIntoView({
			behavior: 'smooth',
			inline: 'center',
		});
		await fetch(`/order-sections?order=${orderArray.toString()}`, {
			method: 'GET',
		});
	}, transitionTime);
	activeButton.style.zIndex = 0;
	activeButton.classList.remove('dragging-manual');
}

let orignalYt;
let moveButtont;
let mouseYt;
let scrollIntt;
const scrollMargint = 50;
const maxScrollAmountt = 20;
const minScrollAmountt = 1;
function startMoveToDo(e, activeElement, parent) {
	const button = activeElement;
	moveButtont = e.target;
	orignalYt = moveButtont.getBoundingClientRect().top + moveButtont.offsetHeight / 2;
	parent.classList.add('dragging-manual-parent');
	// orignalYt = e.clientY;
	button.style.zIndex = 1000;
	button.classList.add('dragging-manual');
	document.addEventListener('mousemove', moveToDo);
	document.addEventListener('mouseup', stopMoveToDo);
}

function moveToDo(e) {
	const activeButton = document.querySelector('.dragging-manual');
	const parent = document.querySelector('.dragging-manual-parent');
	const dist = e.clientY - orignalYt;
	mouseYt = e.clientY;

	if (
		e.clientY >= parent.getBoundingClientRect().top + parent.offsetHeight - scrollMargint &&
		parent.offsetHeight + parent.scrollTop < parent.scrollHeight &&
		(activeButton.nextElementSibling ||
			activeButton.getBoundingClientRect().bottom < parent.getBoundingClientRect().bottom)
	) {
		if (scrollIntt !== undefined) {
			return;
		}
		console.log('scrolling down');
		scrollIntt = setInterval(() => {
			let scrollAmount = mapNumberRange(
				mapNumberRange(
					mouseYt,
					0,
					parent.getBoundingClientRect().top + parent.offsetHeight,
					parent.getBoundingClientRect().top + parent.offsetHeight,
					0,
				),
				0,
				scrollMargint,
				maxScrollAmountt,
				minScrollAmountt,
			);
			if (parent.offsetHeight + parent.scrollTop < parent.scrollHeight) {
				parent.scrollTop += scrollAmount;
				activeButton.style.top = `0px`;
				// orignalYt -= scrollAmount;
				orignalYt = moveButtont.getBoundingClientRect().top + moveButtont.offsetHeight / 2;
				checkSwapToDo(mouseYt);
			} else {
				orignalYt = moveButtont.getBoundingClientRect().top + moveButtont.offsetHeight / 2;
				// parent.scrollTop = parent.scrollHeight;
				clearInterval(scrollIntt);
				scrollIntt = undefined;
			}
		}, 40);
	} else if (
		e.clientY <= parent.getBoundingClientRect().top + scrollMargint &&
		parent.scrollTop > 0
	) {
		if (scrollIntt !== undefined) {
			return;
		}
		// console.log('scrolling up');
		scrollIntt = setInterval(() => {
			// console.log(parent.scrollTop);
			if (parent.scrollTop > 0) {
				let scrollAmount = mapNumberRange(
					mouseYt - parent.getBoundingClientRect().top,
					0,
					scrollMargint,
					maxScrollAmountt,
					minScrollAmountt,
				);
				// console.log(scrollAmount);
				parent.scrollTop -= scrollAmount;
				activeButton.style.top = `0px`;
				// orignalYt += scrollAmount;
				checkSwapToDo(mouseYt);
			} else {
				// parent.scrollTop = 0;
				orignalYt = moveButtont.getBoundingClientRect().top + moveButtont.offsetHeight / 2;
				clearInterval(scrollIntt);
				scrollIntt = undefined;
			}
		}, 40);
	} else {
		if (scrollIntt) {
			// parent.scrollTop = 0;
			orignalYt = moveButtont.getBoundingClientRect().top + moveButtont.offsetHeight / 2;

			clearInterval(scrollIntt);
			scrollIntt = undefined;
		}
		// if (!activeButton.nextElementSibling) {
		// 	parent.scrollTop = parent.scrollHeight;
		// }
		activeButton.style.top = `${dist}px`;
		checkSwapToDo(e.clientY);
	}

	function checkSwapToDo(mouseY) {
		if (
			activeButton.nextElementSibling &&
			mouseY > activeButton.nextElementSibling.getBoundingClientRect().top
		) {
			// console.log(mouseY);
			const nextElement = activeButton.nextElementSibling;
			parent.insertBefore(nextElement, activeButton);
			activeButton.style.top = '0px';
			// orignalYt += nextElement.offsetHeight + 10;
			orignalYt = moveButtont.getBoundingClientRect().top + moveButtont.offsetHeight / 2;
		}
		if (
			activeButton.previousElementSibling &&
			mouseY <
				activeButton.previousElementSibling.getBoundingClientRect().top +
					activeButton.previousElementSibling.offsetHeight
		) {
			const previousElement = activeButton.previousElementSibling;

			parent.insertBefore(activeButton, previousElement);
			previousElement.style.top = '20px';
			setTimeout(() => {
				previousElement.style.top = '0px';
			}, 5);
			// orignalYt -= previousElement.offsetHeight + 10;
			activeButton.style.top = '0px';
			orignalYt = moveButtont.getBoundingClientRect().top + moveButtont.offsetHeight / 2;
		}
	}
}

function stopMoveToDo(e) {
	const transitionTime = 200;
	const activeButton = document.querySelector('.dragging-manual');
	const parent = document.querySelector('.dragging-manual-parent');
	const sectionId = parent.parentElement.dataset.id;
	const toDos = parent.querySelectorAll('.to-do');
	const orderArray = [];
	toDos.forEach((toDo) => {
		orderArray.push(toDo.dataset.id);
	});
	parent.classList.remove('dragging-manual-parent');
	if (scrollIntt) {
		clearInterval(scrollIntt);
		scrollIntt = undefined;
	}
	document.removeEventListener('mousemove', moveToDo);
	document.removeEventListener('mouseup', stopMoveToDo);
	activeButton.style.top = '0px';
	activeButton.style.transition = `top ${transitionTime / 1000}s ease`;
	setTimeout(async () => {
		activeButton.style.transition = '';
		await fetch(`/order-todos?section=${sectionId}&order=${orderArray.toString()}`, {
			method: 'GET',
		});
		// activeButton.scrollIntoView({
		// 	behavior: 'smooth',
		// 	inline: 'center',
		// });
	}, transitionTime);
	activeButton.style.zIndex = 0;
	activeButton.classList.remove('dragging-manual');
}

function mapNumberRange(value, inMin, inMax, outMin, outMax) {
	return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

function rndInt(min, max) {
	if (max === undefined) {
		max = min;
		min = 0;
	}
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

const colors = [
	'#236F6E',
	'#278F8F',
	'#4C2A6B',
	'#6E4D8E',
	'#000099',
	'#223A5E',
	'#093a83',
	'#004400',
	'#104230',
	'#2f4f3a',
	'#570707',
	'#942020',
	'#141414',
	'#3d3d3d',
];

async function addToDo(section) {
	const result = await fetch(`/new-to-do?section=${section.dataset.id}`, { method: 'GET' });
	const data = await result.json();
	const toDoContainer = section.querySelector('.to-do-container');
	const newToDo = document.createElement('div');
	newToDo.dataset.id = data.id;
	newToDo.classList.add('to-do');
	newToDo.innerHTML = /*html*/ `
    				<input onchange="updateToDoText(${data.id}, this.value)" class="text" value="" placeholder="Untitled" />
                    <div class="buttons">
					<button class="button complete" onclick="toggleToDoComplete(this.parentElement.parentElement)" title="Complete To Do">
                        <svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="darkgreen"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="lucide lucide-check-icon lucide-check"
						>
							<path d="M20 6 9 17l-5-5" /></svg>
					</button>
					<button title="Move To Do" onmousedown="startMoveToDo(event, this.parentElement.parentElement, this.parentElement.parentElement.parentElement)" class="button move">
                        <div id="overlay"></div><svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="black"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="lucide lucide-grip-icon lucide-grip"
						>
							<circle cx="12" cy="5" r="1" />
							<circle cx="19" cy="5" r="1" />
							<circle cx="5" cy="5" r="1" />
							<circle cx="12" cy="12" r="1" />
							<circle cx="19" cy="12" r="1" />
							<circle cx="5" cy="12" r="1" />
							<circle cx="12" cy="19" r="1" />
							<circle cx="19" cy="19" r="1" />
							<circle cx="5" cy="19" r="1" /></svg>
                        </button>

					<button title="Delete To Do" class="button" onclick="deleteToDo(${data.id}, this.parentElement.parentElement)"><svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="darkred"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="lucide lucide-trash2-icon lucide-trash-2"
						>
							<path d="M10 11v6" />
							<path d="M14 11v6" />
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
							<path d="M3 6h18" />
							<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                    </div>`;

	toDoContainer.insertBefore(newToDo, toDoContainer.querySelector('.to-do'));
	newToDo.querySelector('.text').focus();
}

async function updateToDoText(toDoId, value) {
	await fetch(`/update-to-do-text?id=${toDoId}&text=${value}`);
}

async function deleteToDo(id, element) {
	const result = await fetch(`/delete-to-do?id=${id}`);
	if (result.status === 200) {
		element.remove();
	}
}

async function toggleToDoComplete(toDo) {
	const completeButton = toDo.querySelector('.button.complete');
	const textInput = toDo.querySelector('.text');
	const completed = toDo.classList.contains('completed');
	let toDos = toDo.parentElement.querySelectorAll('.to-do');
	let orderArray = [];
	toDos.forEach((ele) => {
		if (ele.dataset.id != toDo.dataset.id) orderArray.push(ele.dataset.id);
	});
	if (completed) {
		orderArray.unshift(toDo.dataset.id);
		const result = await fetch(`/set-to-do-complete?complete=false&id=${toDo.dataset.id}`);
		if (result.status !== 200) {
			return;
		}
		const orderResult = await fetch(`/order-todos?order=${orderArray.toString()}`);
		if (orderResult.status !== 200) {
			return;
		}
		toDo.parentElement.insertBefore(toDo, toDos[0]);
		toDo.classList.remove('completed');
		textInput.disabled = false;
		completeButton.innerHTML = /*html*/ `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="darkgreen" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5" /></svg>`;
		completeButton.title = 'Complete To Do';
	} else if (!completed) {
		orderArray.push(toDo.dataset.id);
		const result = await fetch(`/set-to-do-complete?complete=true&id=${toDo.dataset.id}`);
		if (result.status !== 200) {
			return;
		}
		const orderResult = await fetch(`/order-todos?order=${orderArray.toString()}`);
		if (orderResult.status !== 200) {
			return;
		}
		toDos[toDos.length - 1].after(toDo);
		toDo.classList.add('completed');
		textInput.disabled = true;
		completeButton.innerHTML = /*html*/ `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-undo-icon lucide-undo"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`;
		completeButton.title = 'Uncomplete To Do';
	}
}

//need to get param{element} yet and delete to dos inside section from index.js and figure out wich section to scroll to next
async function deleteSection(id) {
	const element = document.querySelector(`.section[data-id="${id}"]`);
	const result = await fetch(`/delete-section?id=${id}`);
	if (result.status === 200) {
		let nextId;
		if (
			element.nextElementSibling &&
			!element.nextElementSibling.classList.contains('spacer')
		) {
			nextId = element.nextElementSibling.dataset.id;
		} else if (
			element.previousElementSibling &&
			!element.previousElementSibling.classList.contains('spacer')
		) {
			nextId = element.previousElementSibling.dataset.id;
		}
		element.remove();
		document.querySelector(`#nav button[data-id="${id}"`).remove();
		if (nextId) {
			scrollToSection(nextId);
		}
	}
}

async function addSection() {
	const color = colors[rndInt(colors.length - 1)];
	const r = parseInt(color.substring(1, 3), 16);
	const g = parseInt(color.substring(3, 5), 16);
	const b = parseInt(color.substring(5, 7), 16);
	const result = await fetch(`/new-section?color=${r},${g},${b}`, { method: 'GET' });
	const data = await result.json();
	const sectionContainer = document.querySelector('#section_container');
	const newSection = document.createElement('div');
	newSection.dataset.id = data.id;
	newSection.classList.add('section');
	newSection.style.setProperty('--r', r);
	newSection.style.setProperty('--g', g);
	newSection.style.setProperty('--b', b);
	newSection.innerHTML = `
			<div class="top-bar">
				<input onchange="updateSectionTitle(${data.id}, this.value)" class="title" value="" />
                <div class="buttons">
                <button onclick="addToDo(this.parentElement.parentElement.parentElement)" class="button" title="Add To Do" >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        stroke-width="2" 
                        stroke-linecap="round" 
                        stroke-linejoin="round" 
                        class="lucide lucide-plus-icon lucide-plus">
                        <path d="M5 12h14"/><path d="M12 5v14"/>
                    </svg>
                </button>
				<label for="color_${data.id}" class="button" title="Edit Section Theme"><svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="lucide lucide-paintbrush-icon lucide-paintbrush"
					>
						<path d="m14.622 17.897-10.68-2.913" />
						<path
							d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z"
						/>
						<path
							d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15"
						/></svg
				></label>
				<input list="colors" id="color_${data.id}" type="color" class="color-input" onchange="sectionThemeChange(this.value, ${data.id} )" oninput="sectionThemeInput(this.value, ${data.id})">
				<button title="Move Section" class="button move" onmousedown="startMove(event, this.parentElement.parentElement.parentElement, this.parentElement.parentElement.parentElement.parentElement)">
                    <div id="overlay"></div>
                    <svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="black"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="lucide lucide-grip-icon lucide-grip">
						<circle cx="12" cy="5" r="1" />
						<circle cx="19" cy="5" r="1" />
						<circle cx="5" cy="5" r="1" />
						<circle cx="12" cy="12" r="1" />
						<circle cx="19" cy="12" r="1" />
						<circle cx="5" cy="12" r="1" />
						<circle cx="12" cy="19" r="1" />
						<circle cx="19" cy="19" r="1" />
						<circle cx="5" cy="19" r="1" />
					</svg>
					</button>
				<button class="button" onclick="deleteSection(${data.id})" title="Delete Section">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="darkred"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="lucide lucide-trash2-icon lucide-trash-2">
						<path d="M10 11v6" />
						<path d="M14 11v6" />
						<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
						<path d="M3 6h18" />
						<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
				</button>
                </div>
			</div>
			<div class="to-do-container">
			</div>`;

	sectionContainer.querySelector('.spacer').after(newSection);
	newSection.querySelector('.title').focus();
	const nav = document.querySelector('#nav');
	const quickButton = document.createElement('button');
	quickButton.style.backgroundColor = 'rgb(163, 0, 16)';
	quickButton.dataset.id = data.id;
	quickButton.setAttribute('onclick', `scrollToSection(${data.id})`);
	quickButton.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
	nav.querySelector('#add_section').after(quickButton);
	scrollToSection(data.id);
}

async function updateSectionTitle(sectionId, value) {
	const result = await fetch(`/update-section-title?id=${sectionId}&title=${value}`);
	if (result.status !== 200) {
		return;
	}
	document.querySelector(`#nav button[data-id="${sectionId}"]`).innerText = value;
}

function sectionThemeInput(color, id) {
	const section = document.querySelector(`.section[data-id="${id}"]`);
	const quickButton = document.querySelector(`#nav button[data-id="${id}"]`);
	const r = parseInt(color.substring(1, 3), 16);
	const g = parseInt(color.substring(3, 5), 16);
	const b = parseInt(color.substring(5, 7), 16);
	section.style.setProperty('--r', r);
	section.style.setProperty('--g', g);
	section.style.setProperty('--b', b);
	quickButton.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}
async function sectionThemeChange(color, id) {
	const r = parseInt(color.substring(1, 3), 16);
	const g = parseInt(color.substring(3, 5), 16);
	const b = parseInt(color.substring(5, 7), 16);
	const result = await fetch(`/update-section-theme?color=${r},${g},${b}&id=${id}`);
	if (result.status === 200) {
		sectionThemeInput(color, id);
	}
}
