import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import { Location } from 'history';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { StaticContext, withRouter } from 'react-router';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import Logout from '@/components/user/logout';
import {
  ExternalLink,
  LabelWithSpinner,
  useIsMounted,
} from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { agreeToTerms } from '@/store/user/actions';
import { selectUserState } from '@/store/user/selectors';
import routes from '@/utils/routes';

interface Props
  extends RouteComponentProps<{}, StaticContext, { from?: Location }> {
  from?: { pathname?: string };
}

const Terms = ({ from = {}, location }: Props) => {
  const user = useSelector(selectUserState);
  let { pathname } = location.state?.from || from;
  if (!pathname) {
    pathname = routes.home();
  }
  const [submitting, setSubmitting] = useState(false);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();

  const doAgree = useCallback(() => {
    setSubmitting(true);
    dispatch(agreeToTerms()).finally(() => {
      /* istanbul ignore else */
      if (isMounted.current) {
        setSubmitting(false);
      }
    });
  }, [dispatch, isMounted]);

  return !user || user.agreed_to_tos_at ? (
    <Redirect to={pathname} />
  ) : (
    <Modal
      isOpen
      disableClose
      heading={i18n.t('Metecho Terms of Service')}
      size="medium"
      footer={[
        <Logout
          key="cancel"
          label={i18n.t('Cancel and Log Out')}
          variant="neutral"
        />,
        <Button
          key="submit"
          label={
            submitting ? (
              <LabelWithSpinner label={i18n.t('Saving…')} variant="inverse" />
            ) : (
              i18n.t('I Agree')
            )
          }
          variant="brand"
          onClick={doAgree}
          disabled={submitting}
        />,
      ]}
    >
      <div className="slds-p-around_large slds-text-longform">
        <Trans i18nKey="termsOfService">
          <p>
            We are so glad that you could join us for Salesforce.org, LLC
            (“Salesforce.org’s”) first-ever virtual Open Source Community
            Sprint. In order to facilitate your contributions to the Open Source
            Commons’ applications and sprint projects, you will need to access
            and use Salesforce.org’s proprietary Metecho tool. These Metecho
            Terms of Service (“Agreement”) govern the use of our tool. Please
            read this Agreement carefully because it is a binding agreement
            between You and Salesforce.com, Inc. (“Salesforce” or “We”).
          </p>
          <p>
            BY ACCEPTING THIS AGREEMENT, BY (1) CLICKING A BOX INDICATING
            ACCEPTANCE OR (2) ACKNOWLEDGING ACCEPTANCE OF THIS AGREEMENT IN A
            SEPARATE DOCUMENT REFERENCING OR INCORPORATING THE TERMS OF THIS
            AGREEMENT, YOU AGREE TO THE TERMS OF THIS AGREEMENT. IF THE
            INDIVIDUAL ACCEPTING THIS AGREEMENT IS ACCEPTING ON BEHALF OF A
            COMPANY OR OTHER LEGAL ENTITY, SUCH INDIVIDUAL REPRESENTS THAT THEY
            HAVE THE AUTHORITY TO BIND SUCH ENTITY AND ITS AFFILIATES TO THESE
            TERMS AND CONDITIONS, IN WHICH CASE THE TERM “YOU” SHALL REFER TO
            SUCH ENTITY AND ITS AFFILIATES. IF THE INDIVIDUAL ACCEPTING THIS
            AGREEMENT DOES NOT HAVE SUCH AUTHORITY, OR DOES NOT AGREE WITH THESE
            TERMS AND CONDITIONS, SUCH INDIVIDUAL MUST NOT ACCEPT THIS AGREEMENT
            AND MAY NOT USE THE METECHO TOOL.
          </p>
          <p>
            Please note that we offer many services. Your use of Salesforce
            products or services are provided by Salesforce pursuant to a
            separate manually or digitally-executed agreement. The Metecho tool
            is not considered a Service under the Salesforce Master Subscription
            Agreement, which does not apply to the use of the Metecho tool.
          </p>
          <p>
            This Agreement was last updated on March 30, 2020. It is effective
            between you and Salesforce as of the date you accept this Agreement.
          </p>
          <h3 className="slds-text-heading_small">The Metecho Tool</h3>
          <p>
            Salesforce.org’s Metecho tool is a proprietary web-based tool for
            collaborating on Salesforce projects. The Metecho tool runs on
            Heroku.
          </p>
          <p>
            The Metecho tool will be used for multiple purposes, including, but
            not limited to:
          </p>
          <ul>
            <li>Creating the project team and assigning work;</li>
            <li>
              Provisioning Salesforce scratch orgs for you to do your
              development work in; and
            </li>
            <li>
              Retrieving your development work from the scratch org and
              committing it to the public open source, SFDO-Community-Sprints
              GitHub repository.
            </li>
          </ul>
          <p>
            The Metecho tool does not access your real production or sandbox
            org, and it does not access any Customer Data as that term is
            defined in the Salesforce Master Subscription Agreement. You do not
            have to use the Metecho tool in order to access the
            SFDO-Community-Sprints GitHub repository.
          </p>
          <h3 className="slds-text-heading_small">
            Your Use of the Metecho Tool
          </h3>
          <p>
            Please do not use the Metecho tool in a way that violates any laws,
            infringes anyone’s rights, is offensive, or interferes with the
            Sites or any features on the Sites (including any technological
            measures we employ to enforce this Agreement).
          </p>
          <p>
            It should be common sense so we won’t bore you with a list of things
            you shouldn’t do. But if we (in our sole discretion) determine that
            you have acted inappropriately, we reserve the right to delete your
            code from our repository, terminate your ability to use the Metecho
            tool, prohibit you from participating in our Open Source Commons or
            other sprints, prohibit you from contributing to our repository, and
            take appropriate legal action.
          </p>
          <h3 className="slds-text-heading_small">Beta Version</h3>
          <p>
            The Metecho tool is still in beta. It is not generally available to
            customers, and is only available to users participating in the Open
            Source Community Sprint.
          </p>
          <p>
            Per the terms of this Agreement, Salesforce shall make the Metecho
            tool available to you, and shall grant you a non-transferable,
            non-sublicensable, non-exclusive license to use the Metecho tool in
            object code form, at no charge. You shall only access the Metecho
            tool for the purpose(s) described by Salesforce. The Metecho tool is
            for evaluation purposes only, is provided as-is, is not supported,
            and may be subject to additional terms.
          </p>
          <h3 className="slds-text-heading_small">Your GitHub Account</h3>
          <p>
            In order to contribute to Salesforce.org’s open source products, you
            will be required to have a GitHub account. By signing up for GitHub,
            you agree to GitHub’s Terms of Service and Privacy Statement and to
            provide GitHub with the information necessary to create and/or
            maintain your account.
          </p>
          <h3 className="slds-text-heading_small">
            Access to Your GitHub Account
          </h3>
          <p>
            In order to facilitate contribution, the Metecho tool requires
            access to your GitHub account including, but not limited to, the
            personal data and code repositories associated with your account, in
            order to carry out actions on your behalf via the GitHub API.
          </p>
          <h3 className="slds-text-heading_small">
            Personal Data Associated with Your GitHub Account
          </h3>
          <p>
            The Metecho tool may access your name, email address, GitHub
            username, GitHub account information information, GitHub profile
            picture and any repositories associated with your GitHub account.
            Other Metecho users participating in the Open Source Community
            Sprint will be able to see your publicly available GitHub profile
            picture and username.
          </p>
          <h3 className="slds-text-heading_small">
            Purposes of Access to Your GitHub Account
          </h3>
          <p>
            Specifically, the Metecho tool will access your GitHub account,
            including your associated personal data, for the following purposes:
          </p>
          <ul>
            <li>Find which repositories you have contributor access to</li>
            <li>Create branches in the repository</li>
            <li>Commit files to branches</li>
            <li>Monitor commit history</li>
            <li>
              Create Pull Requests to submit your work for review and merge into
              the project
            </li>
          </ul>
          <h3 className="slds-text-heading_small">Proprietary Rights</h3>
          <p>
            Subject to the limited rights expressly granted under this
            Agreement, Salesforce and its licensors reserve all rights, title
            and interest in and to the Metecho tool (including reports, data,
            assessments, analyses or compilations of data, collected by, derived
            from, created by or returned by the Metecho tool, including any
            derivative works thereof), including all related intellectual
            property rights. No rights are granted to you hereunder other than
            as expressly set forth herein. Subject to the limited licenses
            granted herein, Salesforce acquires no right, title or interest from
            you or your licensors under this Agreement, including to program
            code.
          </p>
          <h3 className="slds-text-heading_small">License Information</h3>
          <p>
            By using the Metecho tool and participating in the Open Source
            Community Sprint, you agree that any work or code you write while
            using the Metecho tool (a) will be made available in the
            SFDO-Community-Sprints GitHub repository and (b) is subject to
            Salesforce’s Contributor License Agreement.
          </p>
          <p>
            You also agree that both the Metecho tool and any work you do while
            participating in the Open Source Community Sprint are licensed by
            Salesforce.org under the BSD-3 Clause License, found at{' '}
            <ExternalLink url="https://opensource.org/licenses/BSD-3-Clause">
              https://opensource.org/licenses/BSD-3-Clause
            </ExternalLink>
            .
          </p>
          <h3 className="slds-text-heading_small">Feedback</h3>
          <p>
            If you provide feedback to Salesforce regarding the Metecho tool,
            you agree that Salesforce shall have a royalty-free, worldwide,
            irrevocable, perpetual license to use and incorporate into the
            Metecho tool, and successor tools, any suggestion, enhancement
            request, recommendation, correction or other feedback provided by
            you, relating to the operation of the Metecho tool, and any
            successor tools, for use by Salesforce and users of its offerings.
          </p>
          <h3 className="slds-text-heading_small">No Warranty</h3>
          <p>
            THE METECHO TOOL IS PROVIDED “AS-IS,” EXCLUSIVE OF ANY WARRANTY
            WHATSOEVER WHETHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE.
            SALESFORCE DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING WITHOUT
            LIMITATION ANY IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
            A PARTICULAR PURPOSE OR NON-INFRINGEMENT, TO THE MAXIMUM EXTENT
            PERMITTED BY APPLICABLE LAW. SALESFORCE DISCLAIMS ALL LIABILITY FOR
            ANY HARM OR DAMAGES CAUSED BY ANY THIRD PARTY HOSTING PROVIDERS.
          </p>
          <p>
            The Metecho tool may contain bugs or errors. Any participation in or
            use of the Metecho tool is at your sole risk. You acknowledge that
            Salesforce may discontinue the Metecho tool at any time in its sole
            discretion, and may never make an applicable successor tool
            available.
          </p>
          <h3 className="slds-text-heading_small">No Damages</h3>
          <p>
            IN NO EVENT SHALL SALESFORCE HAVE ANY LIABILITY HEREUNDER TO YOU FOR
            ANY DAMAGES WHATSOEVER, INCLUDING BUT NOT LIMITED TO DIRECT,
            INDIRECT, SPECIAL, INCIDENTAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES,
            OR DAMAGES BASED ON LOST PROFITS, DATA OR USE, INCLUDING ANY DAMAGES
            CAUSED BY THE METECHO TOOL ACCESSING YOUR GITHUB ACCOUNT, AND ANY
            REPOSITORIES OR PERSONAL DATA ASSOCIATED WITH YOUR GITHUB ACCOUNT,
            HOWEVER CAUSED AND, WHETHER IN CONTRACT, TORT OR UNDER ANY OTHER
            THEORY OF LIABILITY, WHETHER OR NOT YOU HAVE BEEN ADVISED OF THE
            POSSIBILITY OF SUCH DAMAGES UNLESS SUCH DISCLAIMER OF LIABILITY IS
            NOT ENFORCEABLE UNDER APPLICABLE LAW.
          </p>
          <h3 className="slds-text-heading_small">Assignment</h3>
          <p>
            You may not assign any of its rights or obligations hereunder,
            whether by operation of law or otherwise, without the prior written
            consent of Salesforce (not to be unreasonably withheld).
          </p>
          <h3 className="slds-text-heading_small">
            Agreement to Governing Law
          </h3>
          <p>
            This Agreement is governed by and construed in accordance with the
            laws of California, without regard to its conflict of laws rules.
            You expressly agree that the exclusive jurisdiction for any claim or
            dispute under this Agreement and or your use of the Metecho tool
            resides in the courts located in San Francisco, California, and you
            further expressly agree to submit to the personal jurisdiction of
            such courts for the purpose of litigating any such claim or action.
            If it turns out that a particular provision in this Agreement is not
            enforceable, that will not affect any other provision.
          </p>
          <h3 className="slds-text-heading_small">Contact</h3>
          <p>
            If you have any questions about the above Agreement, please contact
            us via email at{' '}
            <a href="mailto:opensource@salesforce.org">
              opensource@salesforce.org
            </a>
            .
          </p>
        </Trans>
      </div>
    </Modal>
  );
};

export default withRouter(Terms);
