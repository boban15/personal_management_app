This is a custom instructions file for github copilot agent.

This repository is for a producitivity/organizational app. The essential concept is in creating tasks and assigning them to dates (scheduling them). The implementation is similar to a to-do list + calendar. You create tasks that go in the Unscheduled section, and you can assign them to a time by clicking on the clock icon and entering the time of day. You can also drag them to the daily to do list section if you want them assigned to a specific day but not a specific time. Tasks are moved by the user using a click to select and click to drop method.

Future features: 

smart zoom - as the user hovers with a selected task over a time, the schedule "zooms in" on that time, allowing the user to pick a more precise time without having to manually type it. (currently there have been several copilot prs that have tried and failed to implement this feature, I am leaving it alone for now)

weekly/monthly/30-day view - right now the section on the right shows the "daily" view - hours of the day. however, in the future there will be a toggle on the top of screen (click once -> section changes to weekly, click again ,then monthly, then 30 day, then back to daily. optionally, there if you right click there will be a dropdown to select the view type. The only difference between monthly and 30-day view is that monthly is by month, where 30-day only shows 30 days from yesterday. the function of these view types is for easily scheduling tasks many days in the future. Like in the daily view, there will be arrows for moving to the next week or month (depending on the current view). However, if you create a task or move an Unscheduled task to, say, Monday on the weekly view, or the 15th square on the calendar grid in the monthly or 30- day view, and click, then the view will automatically change to the daily view for that day, so that you can then make more fine adjustments. 

add to daily to do list feature - if the user press enter to add a task to the unscheduled section, but then press enter again, the task is moved to the to-dolist of the currently selected day.

data analysis page (conceptual outline still in progress)
- track task frequency over time
- track tasks scheduled vs unscheduled vs day-scheduled (not for specific time, but specific day) over time
- track hours scheduled over time

Known Bugs:

display bug: the hours in the daily view are vertically cut off by some sort of border/padding. how these are displayed must be changed to fix this bug.
