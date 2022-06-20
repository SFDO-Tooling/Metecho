# Steps to Guide a Team Through Metecho

## Step 0 - Log In with GitHub
- Create a [GitHub](https://github.com) account, if you don’t yet have one.
- Contact an admin for the GitHub repository you want to contribute to (e.g.
  Nonprofit Success Pack) on GitHub and ensure that you and anyone you’d like to
  work with are collaborators.

If you want to create a project, skip down to [Create a
Project](#create-a-project).

## Step 1 - Select a Project
**Project** - *(e.g. Nonprofit Success Pack) Projects contain all the work being
done. They are equivalent to GitHub repositories.*

- Select the Project you want to contribute to.
- If you do not see the Project you want to work on:
  - Confirm that you are logged into the correct Metecho account.
  - Contact an admin for the repository on GitHub and ensure that you are a
    collaborator.
  - Select `Re-sync Projects in Metecho`.

To continue, go to **Step 2 - Create a Task** or, if you have a set of several
closely related Tasks in mind, skip to [Step 13 - Create an
Epic](#step-13---create-an-epic)

## Step 2 - Create a Task
**Task** - *Tasks represent small changes to the Project, and may stand alone or
be part of an Epic. Creating a Task creates a branch in GitHub.*

- Select the `Tasks` tab.
- Create a new Task of your own (or from an existing GitHub Issue).
  - Name the Task.
  - The name can be a brief description of the work.
  - Use the optional description section for more detail, if needed.
  - Use the recommended dev org type unless you know of a specific reason to use
    a different one.
  - Select `Create` to save and navigate to your Task detail view. Select `Create &
    New` to continue creating multiple Tasks that are unrelated to each other.
- If you need to edit the Task name or description, or delete the Task, select
  the gear icon in the top right corner. Deleting a Task deletes all the Orgs as
  well.

## Step 3 - Assign Task Developer
**Developer** - *The person assigned to do the work of a Task.*

- `Assign` yourself or another person to be the Developer for each Task you
  created.
- If you do not see the person you want to assign, contact an admin for the
  repository on GitHub and ensure that the person is a collaborator. Then
  `Re-sync GitHub Collaborators` in Metecho.
- If you need to change or remove the Task Developer, use the drop down menu on
  the Developer card in the Task detail view.

## Step 4 - Create Dev Org
**Dev Org** - *A temporary Salesforce org where a Developer can work on
contributions to a Project. Dev Orgs expire after 30 days, and all unretrieved
work is deleted.*

- Review the `Next Steps for This Task` list to see progress and who is
  responsible for the next step.
- To begin work, the Developer will need to select `Create Org` in the Dev Org
  card.
- Dev Org creation can take a number of minutes. Feel free to leave the page.
  Metecho will provide an alert when the Dev Org is ready.

## Step 5 - Make Changes in Dev Org
- **This step takes place in the new Salesforce Dev Org, not in Metecho.**
- Select `View Org` on the Dev Org card to navigate out of Metecho and make your
  changes in the temporary Salesforce Dev Org.

## Step 6 - Retrieve Changes from Dev Org
**Retrieve Changes** - *Pull the work you did in your Salesforce Dev Org into
Metecho so that other people can review it. Developers may retrieve changes as
many times as they like while they are working.*

- When the Developer is ready to pull the Salesforce Dev Org work into Metecho,
  they need to select `Check for Unretrieved Changes` (button located just above
  the Developer card in the Task detail view).
- Select the location to retrieve changes.
  - Use the preselected package directory unless you know of a specific reason
    to select a different option.
- Select the changes to retrieve (or ignore changes you do not intend to
  retrieve).
- Create a commit message that briefly describes the changes.
- Select `Retrieve Selected Changes`.
- Retrieving changes can take a number of minutes. Feel free to leave the page.
  Metecho will provide an alert when the changes have been retrieved.
- Note that the Developer, commit message, and date now appear in a Commit
  History list in the Task detail view.

## Step 7 - Submit Task Changes for Testing
**Submit Changes** - *Document all the changes a Developer made in a Salesforce
Dev Org so that a Tester can test the work and leave a review. This action
creates a pull request in GitHub.*

**Pull Request** - *A way to propose changes on GitHub so that the maintainers
of a Project can review them and accept the changes or request revisions.*

- When the Developer is finished working and retrieving changes, they need to
  select `Submit Task for Testing` (button located just above the Developer card
  in the Task detail view).
- Each commit message briefly described what changed. Now, when submitting the
  Task for testing, describe all the critical changes and why they were made so
  the Tester will understand how to test them.
- Select Submit Task for Testing.

## Step 8 - Assign a Tester
**Tester** - *The person who will look at the Developer’s work, and then approve
the work or request changes that must be addressed before the Task can be
completed.*

- `Assign` yourself or another person to be the Tester for each Task you created.
- Testers can be assigned at any time.
- If you do not see the person you want to assign, contact an admin for the
  repository on GitHub and ensure that the person is a collaborator. Then
  `Re-sync GitHub Collaborators` in Metecho.
- If you need to change or remove the Task Tester, use the drop down menu on the
  Tester card in the Task detail view.

## Step 9 - Create Test Org
**Test Org** - *A temporary Salesforce org where the Tester can look over the
Developer’s work on a specific Task. Test Orgs expire after 30 days.*

- Remember, you can review the Next Steps for This Task list to see progress and
  who is responsible for the next step.
- To begin testing, a Task Tester will need to select `Create Org` in the Test Org
  card.
- Test Org creation can take a number of minutes. Feel free to leave the page.
  Metecho will provide an alert when the Test Org is ready.

## Step 10 - Test Changes in Test Org
- **This step takes place in the new Salesforce Test Org, not in Metecho.**
- Select `View Org` on the Test Org card to navigate out of Metecho and test the
  Developer’s changes in the temporary Salesforce Test Org.

## Step 11 - Submit a Review
- When the Tester is finished testing the Developer’s changes in the Test Org,
  they need to select `Submit Review` on the Test Org card.
- Select `Approve` if no more work is needed.
- Select `Request Changes` if the Developer needs to make revisions.
- Leave a description, especially if there are still changes the Developer needs
  to make, so that the Developer understands what to do next.
- Leaving `Delete Test Org` checked makes sense in most cases.
  - If the changes are Approved, there is no longer any need for the Test Org.
  - If the Developer needs to make changes, the Tester will need to create a new
    Test Org to see the newly retrieved changes.
- Select `Submit Review`.
  - If any change needs to be made to the review, select `Update Review` in the
    Test Org card.

## Step 12 - Merge Pull Request on GitHub
**Merge** - *To add proposed changes to the Project on GitHub.*

- **This step takes place on GitHub, not in Metecho.**
- A contributor with write access to the GitHub repository will need to review
  and merge the pull request. When the pull request has been merged on GitHub,
  the Task status will update to Complete on Metecho.

***

## Step 13 - Create an Epic
**Epic** - *Major contributions to a Project that include more than one related
Task. Epics are more than containers for multiple Tasks. Like Tasks, creating an
Epic creates a branch in GitHub. Tasks that are part of an Epic create branches
from the Epic branch in GitHub.*

- Select the `Epics` tab.
- Create a new Epic of your own (or from an existing GitHub Issue).
  - Name the Epic.
  - The name can be a brief description of the work.
  - Select `create a branch on GitHub` unless you know the name of a specific
    branch you would like to use.
  - Use the optional description section for more detail, if needed.
  - Select `Create` to save and navigate to your Epic detail view.
- If you need to edit the Epic name or description, or delete the Epic, select
  the gear icon in the top right corner. Deleting an Epic deletes all Tasks and
  Orgs as well.

## Step 14 - Add Collaborators
- Select `Add or Remove Collaborators`.
- Select one or more Collaborators to do the work on the Tasks in this Epic.
- If you do not see the people you want to add, contact an admin for the
  repository on GitHub and ensure that the people are collaborators. Then
  `Re-sync GitHub Collaborators` in Metecho.
- If you need to remove a collaborator, select the `X` icon in the Collaborator
  card or uncheck the box in the list of Collaborators.

To continue, go up to [Step 2 - Create a Task](#step-2---create-a-task)

***

## Create a Project
- In the Project list view, select `Create Project`.
- If you do not see the GitHub Organization you want to work in:
  - Confirm that you are logged into the correct Metecho account.
  - Contact an admin for the repository on GitHub and ensure that you are a
    collaborator.
  - Select `Re-sync GitHub Organizations`.
- Select a `GitHub Organization`.
- Create a Project name.
- Select people to add as Collaborators on the Project.
  - If you do not see the people you want to add, contact an admin for the
    repository on GitHub and ensure that the people are collaborators. Then
    `Re-sync GitHub Collaborators` in Metecho.
- Select any dependencies for your new Project.
- Review your Project selections. Select `Create` to save and navigate to your
  Project detail view.

To continue, go up to [Step 2 - Create a Task](#step-2---create-a-task) or
[Step 13 - Create an Epic](#step-13---create-an-epic)

***

## Additional Help
**Select the `?` menu** in the top right corner of Metecho at any time to:
- View specific walkthroughs.
- Activate self-guided tour mode for more detail about everything Metecho can do
  for you.
