import React from 'react';

const UserCard = ({ user }) => <li>{user.login}</li>;

export default ({ users }) => (
  <ul>
    {users.map((user) => (
      <UserCard user={user} />
    ))}
  </ul>
);
