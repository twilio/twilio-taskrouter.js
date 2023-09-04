if [[ -n "$BUILDKITE_PULL_REQUEST_BASE_BRANCH" ]]; then
  {
    echo "sonar.pullrequest.branch=$BUILDKITE_BRANCH"
    echo "sonar.pullrequest.key=$BUILDKITE_PULL_REQUEST"
    echo "sonar.pullrequest.base=$BUILDKITE_PULL_REQUEST_BASE_BRANCH"
  } >> sonar-project.properties
else
  # Release run. Just update the branch
  echo "sonar.branch.name=$BUILDKITE_BRANCH" >> sonar-project.properties
fi
