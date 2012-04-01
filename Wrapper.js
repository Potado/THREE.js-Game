//////////////////////////////////
// Settings

// Creates the nessesary elements and connections for the settings
// Returns an associative array binding element names to their default values
function initSettings(settingTypes, defaultSettings, form) {

	var output = {};

	for(var name in settingTypes) {
		var type = settingTypes[name];

		element = document.createElement('input');

		element.setAttribute('type', type);
		element.setAttribute('id', 'setting_' + name);
		element.setAttribute('name', name);
		
		form.appendChild(element);

		// Set the fields with the default settings
		if(type == 'checkbox') {
			element.checked = defaultSettings[name];
		} else {
			element.value = defaultSettings[name];
		}

		// Set the values with the default settings
		output[name] = defaultSettings[name];
	}

	return output;
}

// Returns the current values of all the settings
function updateSettings(elements, sanitizeSettings, values) {

	for(var index = 0; index < elements.length; index++) {
		var item = elements[index]; // holds the current input element
		var name = item.getAttribute('name');

		// Sanitize the inputs
		var temp = sanitizeSettings[name](item);

		// Set the new value if the function is happy
		if(temp !== undefined) {
			values[name] = temp;
		}

		// And update the input fields to their appropriate values
		if(item.getAttribute('type') == 'checkbox') {
			item.checked = values[name];
		} else {
			item.value = values[name];
		}	
	}

	return values;
}

// Converts a collection to an array
function toArray(collection) {
	var output = [];

	for(var index = 0; index < collection.length; index++) {
		output.push(collection[index]);
	}

	return output;
}

// Create a THREE.js wrapper for easy meshes
// Object oriented hex-grid with expandable