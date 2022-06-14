# Contributing to the Metecho Component Library

The Metecho component library is a source for developers and non-developers
alike to get a quick overview of how components that make up the project behave
and appear.

Components used in in the project are custom versions of SLDS components.

The library was created with Storybook and is deployed using
[Storybook Deployer](https://github.com/storybookjs/storybook-deployer).

## Component Library Structure

Components for the library live in `src/stories/` in folders organized similarly
to how the original component is organized in the `src/js/components` directory.
For example, the component library version of the modal for creating a new
**Epic**, the `createForm` component, would be found in the `epics/` directory:

```
src/
  stories/
    epics/
    createForm/
      index.stories.mdx
      index.stories.tsx
```

Each component folder consists of two files. The `.mdx` file is where
documentation for each component is stored. The rendering of the component, with
all of its relevant states, is located in the `.tsx` file.

## Rendering Components

To render a component, follow the the general
[Storybook steps](https://storybook.js.org/docs/react/writing-stories/introduction)
for configuring a story.

If a component needs to be wrapped in a
[decorator](https://storybook.js.org/docs/react/writing-stories/decorators),
first, import the mock Redux store:

```
import { withRedux } from '../decorators';

```

and add a `decorators` prop to the default export:

```
export default {
  title: 'Commits/List/Example',
  component: CommitListComponent,
  decorators: [withRedux()],
};

```

## Sample Data

Some components require sample data to function correctly. These, and other
required API url routes, can be found in the `fixtures.ts` file in the
`/stories` directory.

Storybook defaults to showing each component prop as a control for each
component in the library. For this project, props that less relevant to the
various states of the component have been disabled.

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
the library is set to deploy automatically to Github Pages each time a new
commit is made to the main branch.

The workflow for this job is located in `.github/workflows/deploy-storybook.yml`

Additional core Storybook configuration settings (i.e. global decorators and
parameters, webpack configuration, story loading, etc.) can be found in the
`.storybook` directory.
