# Contributing to the Metecho Component Library

The Metecho component library is a source for developers and non-developers
alike to get a quick overview of how components that make up the project behave
and appear.

Components used in the project are custom versions of
[SLDS components](https://react.lightningdesignsystem.com/).

The library was created with [Storybook](https://storybook.js.org/)
and is deployed using
[Storybook Deployer](https://github.com/storybookjs/storybook-deployer).

## Component Library Structure

Components for the library are located in `src/stories/` in folders organized
similarly to how the original components are organized in `src/js/components`.
For example, the component library version of the modal for creating a new
**Epic**, the `createForm` component, would be found in the `epics/` directory:

    src/
      stories/
        epics/
          createForm/
            index.stories.mdx
            index.stories.tsx

Each component folder consists of two files. The `.mdx` file is where
documentation for each component is stored. The rendering of the component, with
all of its relevant states, is located in the `.tsx` file.

## Rendering Components

To render a component, follow the the general
[Storybook steps](https://storybook.js.org/docs/react/writing-stories/introduction)
for configuring a story.

In general, this consists of:

- Importing the component from `src/js/components`
- Setting where and how Storybook lists the component with a
  [default export](https://storybook.js.org/docs/react/writing-stories/introduction#default-export)
- [Creating a template](https://storybook.js.org/docs/react/writing-stories/introduction#default-export)
  for how `args` map to rendering
- Setting the component `args` and `argTypes`
- Naming the component story by setting a `storyName`

## Run Component Library Locally

To view changes while you work on the library, use one of the below commands:

    $ ./derrick storybook  # to run Storybook inside a Docker container
    $ yarn storybook  # to run Storybook locally, outside a Docker container

After running one of these commands, you can view the library at
<http://localhost:6006/> in your browser.

# Decorators

If a component relies on the Redux store, it must be wrapped in a
[decorator](https://storybook.js.org/docs/react/writing-stories/decorators).
First import the mock Redux store:

    import { withRedux } from '../decorators';

and then add a `decorators` prop to the default export:

    export default {
      title: 'Commits/List/Example',
      component: CommitListComponent,
      decorators: [withRedux()],
    };

## Sample Data

Some components require sample data and props to function correctly. This data,
and other required API url routes, can be found in `stories/fixtures.ts`.

Storybook defaults to showing each component prop as a control for each
component in the library. For this project, props that are less relevant to the
various states of the component have been disabled. Props more relevant to state
and display are set with appropriate
[control types](https://storybook.js.org/docs/react/essentials/controls#choosing-the-control-type.

## Documenting Components

Documentation for each component is written in a separate `.mdx` file. This
should at minimum consist of the following:

- A header that shows the name of the component and a brief description of its
  role
- A general overview of the component explaining its purpose and possible states
- An embedded rendering of the component

Metecho-specific terms are capitalized and bolded. References to component props
and states are written as `code`.

## Deploying to Github Pages

Through [Storybook Deployer](https://github.com/storybookjs/storybook-deployer),
the library is set to deploy automatically as a static site to Github Pages each
time a commit is made to the `main` branch.

The workflow for this job is located in `.github/workflows/deploy-storybook.yml`

Additional core Storybook configuration settings (i.e. global decorators and
parameters, webpack configuration, story loading, etc.) can be found in the
`.storybook/` directory.
