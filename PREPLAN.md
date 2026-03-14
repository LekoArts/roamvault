# roamvault

## Introduction

The basic idea of this project is to have a nice web UI for one of my bases in Obsidian (https://help.obsidian.md/). Bases is a core plugin that lets you create database-like views of your notes. Using a base you can view, edit, sort, and filter files and their properties. Bases can help you organize everything from projects to travel plans, reading lists, and more.

In my instance I have a base called "Travel". It's where I organize all my travel plans. This base is driven by files that link to that base. I've added an example folder structure inside `@tests/fixtures` that we can use for unit tests and also for testing in the UI. Because the Obsidian vault and its files live on the filesystem and I want to use browser APIs to read and write files in that UI.

## Basic goal

When creating a new travel note or adding new items for a trip, I want to have a web UI that allows me to easily create these files with one click. Right now, inside Obsidian I have to create a new file, apply the right template, and fill out the properties. Then when I want to create roadtrip stops, or activities/planning notes, I have to again create a new file myself in the right place, apply the template and fill out the correct properties. This is a bit of a hassle and I want to have a nice UI that allows me to do this with one click.

## Goals

- The Obsidian vault I'm opening is the source of truth. The UI should use these files to do its work and reflect its logic from these files.
- No file editing in the UI. The UI is only for creating new files in the right place, with the right properties and the right template.
- The web app should remember the last opened vault and open it again when the user opens the app again. The user should also be able to open a different vault if they want to.
- The folder structure of travel data should be displayed in a nice UI.
- The UI needs to account for the types of travel: Simple trips, advanced trips (with activities and day plans), and roadtrips (with stops).
- The UI should allow for light & dark mode
- A simple confirmation, save and cancel flow when creating new files. No need for a complex UI here, just a simple form with the right fields and a save/cancel button.

## Inspiration

The main inspiration for this project is https://github.com/blamouche/browsidian. This project is a web UI for Obsidian vaults. It does way more than I need for my project and it should **ONLY** be taken as inspiration. Do not copy code from that project.

## Examples

### Example: User flow for creating a new trip

1. The user opens the web app and sees a list of their travel plans (based on the files in their vault).
2. The user clicks on a "New Trip" button.
3. A form appears where the user can enter the name of the trip, the type of trip (simple, advanced, roadtrip).
4. Depending on the type of trip, the correct template is chosen and all required properties need to be filled out (the properties are in the frontmatter of the template file).
5. The user clicks "Save" and a new file is created in the right place in the vault with the correct template and properties filled out. The user is then taken to the new file in the UI.

### Example: User flow for creating items inside an existing trip

Let's say the user has an existing trip called "Summer Vacation 2024". They want to add a new activity to this trip.

1. The user clicks on the "Summer Vacation 2024" trip in the UI.
2. They see an overview of the trip with all its details and a list of existing activities and day plans.
3. The user clicks on a "New Activity" button.
4. A form appears where the user can enter the required properties for the activity (based on the template for activities).
5. The user clicks "Save" and a new file is created in the right place in the vault with the correct template and properties filled out. The user stays in the trip overview in the UI and sees the new activity added to the list of activities for that trip.

## Folder structure

This is all reflected in the `@tests/fixtures` folder. This folder contains a sample vault with the following structure:

`_templates`: This folder contains the templates for the different types of trips and items. The templates are simple markdown files with frontmatter that defines the required properties for that type of file.

`_templates/Activity.md`: For a `Travel_Advanced` trip, a user can create an activity. That activity can be later added to a `Planning.md` file for a specific day. This template defines the properties that are required for an activity. These files need to go into an `Activities` folder inside the trip folder.

`_templates/Planning.md`: For a `Travel_Advanced` trip, a user can create a day plan. This template defines the properties that are required for a day plan. This can also span multiple days. These files need to go into a `Planning` folder inside the trip folder.

`_templates/Stop.md`: For a `Travel_Roadtrip` trip, a user can create a stop. This template defines the properties that are required for a stop. These files need to go into a `Roadtrip` folder inside the trip folder.

`_templates/Travel_Advanced.md`: This template is for an advanced trip. Inside will be a list of plans for each day and a list of activities.

`_templates/Travel_Roadtrip.md`: This template is for a roadtrip. Inside will be a list of stops.

`_templates/Travel_Simple.md`: This template is for a simple trip.

`Travel`: This folder contains a list of folders (years). Inside each year folder is either a `.md` file (used for a `Travel_Simple` trip) or a folder with the name of the trip (used for `Travel_Advanced` and `Travel_Roadtrip` trips). Inside the trip folder are the files for that trip (the main trip file, and any activities, plans, or stops).

## Properties

This is **really** important. Each file contains a frontmatter with properties. This web app must correctly read and use the properties from the templates.

- The `base` property needs to stay the same as in the templates
- For `backlink` properties the correct trip file needs to be added. Example: Inside `Travel/2026/Singapur & Südkorea` exists the trip file `Singapur & Südkorea.md`. If I create a new activity for this trip, the `backlink` property in the activity template needs to be replaced with `[[Singapur & Südkorea]]`.
- If a property is empty (e.g. like `Location` in the `Activity.md` template), the user needs to fill it out in the form when creating a new activity. The same applies for properties that are arrays (like `Persons` in the `Travel_Advanced.md` template). The form needs to allow the user to fill out these properties correctly.
- Some properties contain date placeholder like `"{{date}}"`. When creating a new file based on the template, these placeholders need to be replaced with the current date (or the date the user selects in the form). The date format should be `YYYY-MM-DD` for properties that are meant to be used as dates, and `DD.MM.YYYY` for properties that are meant to be displayed in the UI.
- For the `banner` property, allow the user to paste in an image URL
