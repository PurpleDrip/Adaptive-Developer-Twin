
{
	extension_id,
	machine_id,
	sync_type,
	timestamp,
	wpm,
	keystrokes,
	commands_executed,
	idle_seconds,
	active_file,
	diff_payload,
	workspace_snapshot_url,
	git_branch,
	code_snippet,
	languages_used,
	processed,
	ingested_at: 
}

Explanation of each parameter-

extension_id - after installation of the extension on the IDE, the user will be asked to enter the extension id (which is given to the user after User Registration)

machine_id - after the installation of the extension on the IDE, the device generates a unique id which is stores as machine_id 
const mid = vscode.env.machineId;

sync_type - mentions the way of sending data, which is not very important right now.

timestamp - time of sending the data

wpm - Words per Minute

keystrokes - used for metrics and to analyze if the user was idol and more.

commands_executed - self explanatory

idle_seconds - self explanatory

active_files - where the user is working at majority of the time, we want to sent the server abt the details of the user where they are working rn, so that its easy to judge and tell wat the user is upto.

diff_payload - this is used as a optimization feature. The IDE stores the hash of the last sent Telemetry Raw Data. if the 1 which is going to be sent also has the same hash, then its not sent. this saves memory and prevents the data from reaching the DB which has no weights. (Unified diff for the active window)

workspace_snapshot_url - URL/Base64 of full zip for INITIAL/FINAL sync

git_branch - current working branch

code_snippet - code is sent from the active area of the user to tell wat exactly the user is working on.

languages_used - self explanatory

processed - by deafult its false, When the Fusion Starts and this Raw data is selected, then its modified to True.

ingested_at - the time when this data was gone through Fusion process.
