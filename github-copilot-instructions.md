This is a custom instructions file for github copilot agent.

This repository is for a producitivity/organizational app. The essential concept is in creating tasks and assigning them to dates (scheduling them). The implementation is similar to a to-do list + calendar. You create tasks that go in the Unscheduled section, and you can assign them to a time by clicking on the clock icon and entering the time of day. You can also drag them to the daily to do list section if you want them assigned to a specific day but not a specific time. Tasks are moved by the user using a click to select and click to drop method.

## Features

add to daily to do list - if the user presses enter to add a task to the unscheduled section, but then presses enter again (without typing anything), the task is moved to the daily to-do list of the currently selected day.

weekly/monthly/30-day view - the section on the right can display different time period views. There is a toggle button on the top of the screen (click once -> section changes to weekly, click again -> monthly, then 30 day, then back to daily). The difference between monthly and 30-day view is that monthly shows a full calendar month, while 30-day shows exactly 30 days from yesterday. These view types allow for easily scheduling tasks many days in the future. Like in the daily view, there are arrows for moving to the next week or month (depending on the current view). When you move an Unscheduled task to a specific day in weekly/monthly/30-day view, the view automatically changes to the daily view for that day, allowing for fine adjustments.

## Future Features

smart zoom - as the user hovers with a selected task over a time, the schedule "zooms in" on that time, allowing the user to pick a more precise time without having to manually type it. (currently there have been several copilot prs that have tried and failed to implement this feature, I am leaving it alone for now)

data analysis page (conceptual outline still in progress)
- track task frequency over time
- track tasks scheduled vs unscheduled vs day-scheduled (not for specific time, but specific day) over time
- track hours scheduled over time

Known Bugs:

display bug: the hours in the daily view are vertically cut off by some sort of border/padding. how these are displayed must be changed to fix this bug.
