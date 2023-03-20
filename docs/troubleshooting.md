# Troubleshooting Metecho Operations

This section summarizes some common challenges with Metecho operations and how to address them.

## CumulusCI Version - Mismatch between Github project & Metecho

If you create a CumulusCI project using a newer CCI version (`cci project init`) and then try to use Metecho to create a scratch org, you will see an error message similar to the following:

![Error reading "This project requires CumulusCI version X or later](old-cumulusci-version.png)

### Solution

To fix this issue you will need to remove the `minimum_cumulusci_version` line from your project's `cumulusci.yml` file. However, please note that if you are using new functionality in the latest version, your project may not work correctly on Metecho until Metecho itself is updated.

## Automation on Branches

Metecho runs automation only from the main branch. This ensures that automation changes go through a code review process (enforced by branch protection rules) before those changes are executed.

### Solution

Make sure you merge automation changes (including changes to org definitions) to the main branch before attempting to use them.
