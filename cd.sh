#!/bin/bash

# 此脚本会统一提供最新的版本，最好不要在自己的项目中对此脚本进行修改
function do_cd(){
  clusterID=$1
  imageFullName=$2
  namespace=$3
  workload=$4
  version=$5

  url=${RANCHER_API_BASE_URL}/k8s/clusters/${clusterID}/apis/apps/v1/namespaces/${namespace}/deployments/${workload}
  imagePath=${imageFullName}:${version}

  data='[{"op":"replace","path":"/spec/template/spec/containers/0/image","value":"'${imagePath}'"}]'

  # echo curl -u "${PROD_RANCHER_TOKEN}" -X PATCH -H 'Content-Type: application/json-patch+json' $url -d "${data}"
  curl -u "${PROD_RANCHER_TOKEN}" -X PATCH -H 'Content-Type: application/json-patch+json' $url -d "${data}"
}

function deploy_cluster(){
  clusterID=$1
  version=$2

  echo "do upgrade, version: ${version}"
  namespace=launcher
  imageFullName=${DEPLOY_IMAGE_HOST}${DEPLOY_IMAGE_PATH}

  for wk in $DEPLOY_PROJECT_WORKLOAD
  do
    do_cd $clusterID $imageFullName $DEPLOY_NAMESPACE $wk $version
  done
}

function each_cluster(){
  lastReleaseTag=$(git tag --list | grep -E "^release_" | sort -V | tail -1)
  lastDeployTag=$(git tag --list | grep -E "^deploy_" | sort -V | tail -1)

  splitV=(${lastDeployTag//_/ })
  splitSite=${splitV[2]}

  for clusterID in $RANCHER_CLUSTER_IDS
  do
    if [[ -z "$splitSite" || "$splitSite" == "all" || "$clusterID" == "$splitSite":* ]]; then
      splitClusterID=(${clusterID//:/ })
      echo ${splitClusterID[0]} ${splitClusterID[1]} $lastReleaseTag
      deploy_cluster ${splitClusterID[1]} $lastReleaseTag
    fi
  done
}

function do_trigger_tag(){
  trigger_site=$1

  git fetch --tag
  lastReleaseTag=$(git tag --list | grep -E "^release_" | sort -V | tail -1)
  lastReleaseTagCommitID=$(git rev-list -n 1 ${lastReleaseTag})
  lastDeployTag=$(git tag --list | grep -E "^deploy_" | sort -V | tail -1)

  [[ ${#lastDeployTag} > 0 ]] && {
    v=(${lastDeployTag//_/ })
    v_main=${v[0]}

    # 当前版本的 tag 已经存在，后续版本数字递增1
    deployCount=$[10#${lastDeployTag:${#v_main} + 1:5} + 100001]
    deployCount=${deployCount:1:5}

    echo $deployCount

    if [[ -z "$trigger_site" || "$trigger_site" == "all" ]]; then
      newDeployTag=${v_main}_${deployCount}
    else 
      newDeployTag=${v_main}_${deployCount}_${trigger_site}
    fi

  } || {
    newDeployTag=deploy_00001
  }

  echo $newDeployTag

  # 在最新的 release tag 处打上 deploy tag，触发 CD 动作
  git tag -a $newDeployTag -m 'deploy trigger ${newDeployTag}' $lastReleaseTagCommitID
  git push --tags
}

while getopts ":t:d" opt; do
    case $opt in
        t)
            echo "add a tag to deploy trigger"
            param_t="$OPTARG"

            do_trigger_tag $param_t
            ;;
        d)
            echo "do deploy"
            each_cluster
            ;;
        ?)
            echo "-t: trigger CD action, with the option to specify site deployment, or 'all' to deploy all sites"
            exit 1
            ;;
    esac
done

