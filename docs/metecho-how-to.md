# Salesforce Contributor Guide to Metecho: Step-by-Step

## Welcome to Metecho

If you or your team would like to contribute to a Salesforce Project without
using GitHub, you've come to the right place.

**Definition:** *[Greek] To share or participate in.*

**Pronunciation:** *“Met” rhymes with “bet.” “Echo” as in the reflection of
sound waves.*

## Why We Built Metecho

**Metecho makes it easier to collaborate on sharable Salesforce Projects.**
View, test, and contribute to Projects without learning to edit code on GitHub.
Collaborate with a team. Create temporary Salesforce Orgs. Make changes,
retrieve them, and add your work to a Project with this interactive tool.

## What You'll Learn

After working through this Guide, you will be able to:

- **Play**: Make a Scratch Org to view Projects, play with ideas, or create
  demos.
- **Help**: Browse available Tasks and test work that is ready for review.
- **Plan**: Create a Task or an Epic and contribute your work to a Project.
- **Innovate**: Create a new Salesforce Project.
- **Define**: Understand the meaning of essential Metecho (and GitHub) terms.

***

## Step 0 - Log In With GitHub

Metecho works by talking to GitHub for you. While you don't need to use GitHub
directly, you do still need a GitHub account.

- Create a [GitHub](https://github.com) account, if you don’t already have one.
- Select `Log In With GitHub`.

If you want to create a Project, skip down to [Create a
Project](#create-a-project). Otherwise, once you're logged in with your GitHub
account, you can continue to Step 1. Yay!

## Step 1 - Select a Project

**Project** - *Projects (e.g. Outbound Funds, Snowfakery) contain all the work
being done. They are equivalent to GitHub repositories.*

- Select the Project you want to contribute to.
- If you don't see the Project you want to work on:
  - Confirm that you are logged into the correct Metecho account.
  - Contact an admin for the repository on GitHub and ensure that you are a
    collaborator.
  - Select `Re-Sync Projects` in Metecho.

### What's your goal?

- To contribute to a Project, continue to [Step 2 - Create a
  Task](#step-2---create-a-task).

- If you want to create a group of several related Tasks, skip to [Step 13 -
  Create an Epic](#step-13---create-an-epic).

- If you want to help test a Task that is ready for review, skip to [Step 8 -
  Assign a Tester](#step-8---assign-a-tester).

- If you want to view the work on a Project or make changes without affecting
  the Project, skip to [Create a Scratch Org in
  Metecho](#create-a-scratch-org-in-metecho).

## Step 2 - Create a Task

**Task** - *Tasks represent small changes to the Project, and may stand alone or
be part of an Epic. Creating a Task creates a branch in GitHub.*

- On the Project's detail page, select the `Tasks` tab.
- Create a new Task of your own (or from an existing GitHub Issue).
  - Name the Task.
  - The name can be a brief description of the work.
  - Use the optional description section for more detail, if needed.
  - Use the recommended `dev` Org Type unless you know of a specific reason to
    use a different one.
  - If you want to create a single Task, select `Create` to save and navigate to
    your new Task.
  - If you want to create this Task and then create additional Tasks, select
    `Create & New`.

    ![create tasks modal with create, create & new options](/docs/create-task-modal.jpg?raw=true)

- If you need to edit the Task name or description, or delete the Task, select
  the gear icon in the top right corner. Deleting a Task deletes all the Orgs as
  well.

  ![task drop down edit and delete](/docs/task-gear.jpg?raw=true)

## Step 3 - Assign a Task Developer

**Developer** - *The person assigned to do the work of a Task.*

- On the Task's detail page, `Assign` yourself or another person to be the
  Developer for each Task you created.
- If you don't see the person you want to assign, contact an admin for the
  repository on GitHub and ensure that the person is a collaborator. Then
  `Re-Sync GitHub Collaborators` in Metecho.
- If you need to change or remove the Task Developer, use the drop down menu on
  the Developer card in the Task detail view.

  ![developer drop down change and remove](/docs/developer-dropdown.jpg?raw=true)

## Step 4 - Create a Dev Org in Metecho

**Dev Org** - *A temporary Salesforce Org where a Developer can work on
contributions to a Project. Dev Orgs expire after 30 days, and all unretrieved
work is deleted.*

- On the Task's detail page, you can review the `Next Steps for This Task` to
  see progress and who is responsible for the next step.

  ![list of next steps for the tasks](/docs/task-next-steps.jpg?raw=true)

- To begin work, the Developer will need to select `Create Org` in the Dev Org
  card.
- Dev Org creation can take a number of minutes. Feel free to leave the page.
  Metecho will provide an alert when the Dev Org is ready.

## Step 5 - Make Changes in Dev Org

- **Changes to a Dev Org must be made in the Salesforce UI, not in Metecho.**
- Select `View Org` on the Dev Org card to navigate out of Metecho and make your
  changes in the temporary Dev Org in Salesforce.

## Step 6a - Retrieve Changes from Dev Org

**Retrieve Changes** - *Pull the work you did in your Dev Org (in Salesforce)
into Metecho so that other people can review it. Developers may retrieve changes
as many times as they like while they are working.*

**Commit** - *A way to document and describe changes the Developer retrieves
from the Dev Org. Each time a Developer makes a commit, it is saved in a Commit
History list.*

- When the Developer is ready to pull the Dev Org work from Salesforce into
  Metecho, they need to select `Retrieve Changes from Dev Org`.

  ![retrieve changes button](/docs/retrieve-changes.jpg?raw=true)

  - If that option does not appear, select `check again`. The Developer may not
    need to do this step as changes are retrieved automatically when first
    navigating to the page.

    ![check for unretrieved changes button](/docs/check-again.jpg?raw=true)

- Select the location to retrieve changes.
  - Use the preselected package directory unless you know of a specific reason
    to select a different option.
- Select the changes to retrieve (or ignore changes you do not intend to
  retrieve).
- Enter a commit message that briefly describes the changes.
- Select `Retrieve Selected Changes`.
- Retrieving changes can take a number of minutes. Feel free to leave the page.
  Metecho will provide an alert when the changes have been retrieved.

  ![successfully finished retrieving changes](/docs/retrieve-success.jpg?raw=true)

- Note that the Developer, commit message, and date now appear in a Commit
  History list in the Task detail view.

  ![list of commits](/docs/commit-history.jpg?raw=true)

## Step 6b - Retrieve a Dataset

- The Developer can also retrieve datasets anytime after they have visited the
  Dev Org within Salesforce.
- Select `Retrieve Dataset`.

  ![retrieve dataset button](/docs/retrieve-dataset.jpg?raw=true)

- Select the Default dataset, another existing dataset, or enter a custom name
  to create a new dataset. If you don't know what to choose, select the 
  default dataset.
- Begin typing to search for objects and fields to include or remove from the
  dataset.
  - Only 50 objects are displayed, but you can enter a term in the search box to
    search the full list.
- Check objects and fields from the left panel to include in the dataset. A
  summary of the selected data appears in the right panel.
- Uncheck objects and fields to remove them from the dataset.
- If the Developer is retrieving an existing dataset, a list may appear at the
  top of the page with fields that no longer exist in the Dev Org. When the
  existing dataset is retrieved, those items will be removed.
- Enter a commit message that briefly describes the dataset.
- Select `Retrieve Selected Data`.
- Retrieving a dataset can take a number of minutes. Feel free to leave the
  page. Metecho will provide an alert when the data have been retrieved.

## Step 6c - Retrieve OmniStudio Configuration

- The Developer can also retrieve OmniStudio metadata/configuration if they
  have OmniStudio development capabilities set up in the dev org.
- Your repository `cumulusci.yml` needs to have a scratch org definition that
  has OmniStudio features enabled and the `setup_flow` defined to install the 
  VBT and OmniStudio package and deploy the necessary Remote Site Settings. 
  [See details on OmniStudio org configuration in CumulusCI docs.](https://cumulusci.readthedocs.io/en/stable/dev-omnistudio.html#set-up-a-dev-org-with-omnistudio) 
  Note that initial OmniStudio setup happens outside of Metecho, as part of defining
  the orgs for your project. Consult an engineer if you need assistance.
- Visit the scratch org and make your OmniStudio changes.
- Select `Retrieve OmniStudio Configuration`.

  ![retrieve omnistudio button](/docs/retrieve-omnistudio.jpg?raw=true)

- Enter the path to your Vlocity YAML job file that includes queries that will
  capture your changes. Your job file should have the filename extension `.yaml`.
- Enter a commit message that briefly describes the OmniStudio configuration.
- Select `Retrieve OmniStudio Configuration`.
- Retrieving OmniStudio configuration can take a number of minutes. Feel free to
  leave the page. Metecho will provide an alert when the data have been retrieved.

## Step 7 - Submit Task Changes for Testing

**Submit Changes** - *Document all the changes a Developer made in a Dev Org
within Salesforce so that a Tester can test the work and leave a review. This
action creates a pull request in GitHub.*

**Pull Request** - *A way to propose changes on GitHub so that the maintainers
of a Project can review them and accept the changes or request revisions.*

- When the Developer is finished working and retrieving changes, they need to
  select `Submit Task for Testing`.

  ![submit task for testing button](/docs/submit-testing.jpg?raw=true)

- When submitting the Task for testing, describe all the critical changes and
  why they were made so the Tester will understand how to test them.
- Select `Submit Task for Testing`.

## Step 8 - Assign a Tester

**Tester** - *The person who will look at the Developer’s work, and then approve
the work or request changes that must be addressed before the Task can be
completed.*

- `Assign` yourself or another person to be the Tester for each Task you
  created.
- Testers can be assigned at any time.
- If you don't see the person you want to assign, contact an admin for the
  repository on GitHub and ensure that the person is a collaborator. Then
  `Re-Sync GitHub Collaborators` in Metecho.
- If you need to change or remove the Task Tester, use the drop down menu on the
  Tester card in the Task detail view.

  ![tester drop down change and remove](/docs/tester-dropdown.jpg?raw=true)

## Step 9 - Create a Test Org

**Test Org** - *A temporary Salesforce Org where the Tester can look over the
Developer’s work on a specific Task. Test Orgs expire after 30 days.*

- Remember, you can review the `Next Steps for This Task` to see progress and
  who is responsible for the next step.
- To begin testing, a Task Tester will need to select `Create Org` in the Test
  Org card.
- Test Org creation can take a number of minutes. Feel free to leave the page.
  Metecho will provide an alert when the Test Org is ready.

## Step 10 - Test Changes in a Test Org

- **Testing must be done in the Salesforce UI, not in Metecho.**
- Select `View Org` on the Test Org card to navigate out of Metecho and test the
  Developer’s changes in the temporary Test Org in Salesforce.

## Step 11 - Submit a Review

- When the Tester is finished testing the Developer’s changes in the Test Org
  (in Salesforce), they need to go back to Metecho and select `Submit Review` on
  the Test Org card.
- Select `Approve` if no more work is needed.
- Select `Request Changes` if the Developer needs to make revisions.
- Leave a description, especially if there are still changes the Developer needs
  to make, so that the Developer understands what to do next.
- Leaving `Delete Test Org` checked makes sense in most cases.
  - If the changes are Approved, there is no longer any need for the Test Org.
  - If the Developer needs to make changes, the Tester will need to create a new
    Test Org to see the newly retrieved changes.
- Select `Submit Review`.
  - To edit your review, select `Update Review` in the Test Org card.

## Step 12 - Merge a Pull Request on GitHub

**Merge** - *To add proposed changes to the Project on GitHub.*

- **Merging a Pull Request must be done in GitHub, not in Metecho.**
- A contributor with write access to the GitHub repository will need to review
  and merge the pull request. When the pull request has been merged on GitHub,
  the Task status will update to Complete on Metecho.

***

## Step 13 - Create an Epic

**Epic** - *Major contributions to a Project that include more than one related
Task. Epics are more than containers for multiple Tasks. Creating an Epic
creates a branch in GitHub. Tasks that are part of an Epic create branches from
the Epic branch in GitHub.*

- On a Project's detail page, select the `Epics` tab.
- Create a new Epic of your own (or from an existing GitHub Issue).
  - Name the Epic.
  - The name can be a brief description of the work.
  - Select `Create new branch on GitHub` unless you know the name of a specific
    existing branch you would like to use.
  - Use the optional description section for more detail, if needed.
  - Select `Create` to save and navigate to your new Epic.
- If you need to edit the Epic name or description, or delete the Epic, select
  the gear icon in the top right corner. Deleting an Epic deletes all Tasks and
  Orgs as well.

  ![epic drop down menu rename or delete](/docs/epic-gear.jpg?raw=true)

## Step 14 - Add Collaborators

- On the Epic's detail page, select `Add or Remove Collaborators`.
- Select one or more Collaborators to do the work on the Tasks in this Epic.
- If you don't see the people you want to add, contact an admin for the
  repository on GitHub and ensure that the people are collaborators. Then
  `Re-Sync GitHub Collaborators` in Metecho.
- If you need to remove a collaborator, select the `x` icon in the Collaborator
  card or uncheck the box in the list of Collaborators.

To continue, go up to [Step 2 - Create a Task](#step-2---create-a-task)

***

## Create a Scratch Org in Metecho

**Scratch Org** - *A temporary Salesforce Org where anyone can view the work on
a Project, create a demo, or play with changes without affecting the Project.
Scratch Orgs expire (and are deleted) after 30 days.*

- On the Project detail page, select `Create Scratch Org` under `My Project
  Scratch Org` in the right-hand column.
- Scratch Org creation can take a number of minutes. Feel free to leave the
  page. Metecho will provide an alert when the Scratch Org is ready.
- You can also select an Epic or Task to create a Scratch Org for specific work
  in progress.

## Make Changes in Scratch Org

- **Changes to a Scratch Org must be made in the Salesforce UI, not in
  Metecho.**
- Select `View Org` on the Scratch Org card to navigate out of Metecho and make
  your changes in the temporary Scratch Org in Salesforce.

## Contribute Work from Scratch Org

- If you decide you want to contribute your Scratch Org changes to the Project,
  select `Contribute Work` in the Scratch Org card.
  - If that option does not appear, select `check again`. You may not
    need to do this step as changes are retrieved automatically when first
    navigating to the page.
- Create a new Task with or without an Epic. (You only need an Epic if you want
  to create a group of related Tasks.)
- Your Scratch Org will become the Dev Org for the newly created Task.

***

## Create a Project

- In the Project list view, select `Create Project`.
- If you don't see the GitHub Organization you want to work in:
  - Confirm that you are logged into the correct Metecho account.
  - Contact an admin for the repository on GitHub and ensure that you are a
    collaborator.
  - Select `Re-Sync GitHub Organizations`.
- Select a `GitHub Organization`.
- Enter a Project name.
- Select people to add as Collaborators on the Project.
  - If you don't see the people you want to add, contact an admin for the
    repository on GitHub and ensure that the people are collaborators. Then
    `Re-Sync GitHub Collaborators` in Metecho.
- Select any dependencies for your new Project (this step may not appear if
  there are no approved dependencies).
- Review your Project selections. Select `Create` to save and navigate to your
  new Project.

To continue, go up to [Step 2 - Create a Task](#step-2---create-a-task) or
[Step 13 - Create an Epic](#step-13---create-an-epic)

***

## Delete Your Account

- Select your avatar in the upper right-hand corner.
- Select `Manage Account`.
- If you are assigned to a Task, you will see a list of those Tasks.
  - Navigate to those Tasks and retrieve any relevant changes from Dev Orgs.
- Select `Delete Account`.
  - Your Dev Orgs will be deleted, and any unretrieved changes will be lost.
  - This action cannot be undone.
  - Deleting your Metecho account will not remove your access to the GitHub
    repository.

***

## Additional Help

**Select the `?` menu** in the top right corner of Metecho at any time to:

- View specific walkthroughs.
- Activate self-guided tour mode for more detail about everything Metecho can do
  for you.

  ![help button for guided walkthroughs and self-guided tour](/docs/help.jpg?raw=true)
