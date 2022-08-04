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

  imageHost=pubrepo.jiagouyun.com

  if [ $DEPLOY_PROJECT_NAME = "kodo" ]; then
    echo "do kodo upgrade, version: ${version}"
    namespace=forethought-kodo
    imageFullName=${imageHost}/cloudcare-forethought/kodo
    workload="kodo kodo-inner kodo-ws kodo-x"
  elif [ $DEPLOY_PROJECT_NAME = "core" ]; then
    echo "do core upgrade, version: ${version}"
    namespace=forethought-core
    imageFullName=${imageHost}/cloudcare-forethought/cloudcare-forethought-backend
    workload="core-worker core-worker-beat core-worker-correlation front-backend inner management-backend open-api openapi"
  elif [ $DEPLOY_PROJECT_NAME = "studio_front" ]; then
    echo "do studio front upgrade, version: ${version}"
    namespace=forethought-webclient
    imageFullName=${imageHost}/cloudcare-forethought/cloudcare-forethought-webclient
    workload="front-webclient"
  elif [ $DEPLOY_PROJECT_NAME = "studio_mgr" ]; then
    echo "do studio management upgrade, version: ${version}"
    namespace=forethought-webclient
    imageFullName=${imageHost}/cloudcare-forethought/cloudcare-forethought-webmanage
    workload="management-webclient"
  elif [ $DEPLOY_PROJECT_NAME = "func" ]; then
    echo "do func upgrade, version: ${version}"
    namespace=func2
    imageFullName=${imageHost}/dataflux-func/dataflux-func
    workload="server server-inner worker-0 worker-1-6 worker-7 worker-8 worker-9 worker-beat"
  elif [ $DEPLOY_PROJECT_NAME = "launcher" ]; then
    echo "do launcher upgrade, version: ${version}"
    namespace=launcher
    imageFullName=${imageHost}/cloudcare-forethought/cloudcare-forethought-setup
    workload="launcher"
  fi

  for wk in $workload
  do
    do_cd $clusterID $imageFullName $namespace $wk $version
  done
}

function each_cluster(){
  lastReleaseTag=$(git tag --list | grep -E "^release_" | sort -V | tail -1)

  for clusterID in $RANCHER_CLUSTER_IDS
  do
    deploy_cluster $clusterID $lastReleaseTag
  done
}

function do_trigger_tag(){
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

    newDeployTag=${v_main}_${deployCount}
  } || {
    newDeployTag=deploy_00001
  }

  # 在最新的 release tag 处打上 deploy tag，触发 CD 动作
  git tag -a $newDeployTag -m 'deploy trigger ${newDeployTag}' $lastReleaseTagCommitID
  git push --tags
}

while getopts ":td" opt
do
    case $opt in
        t)
            echo "add a tag to deploy trigger"
            do_trigger_tag
            ;;
        d)
            echo "do deploy"
            each_cluster
            ;;
        ?)
            echo "-t: add a tag to deploy trigger"
            exit 1
            ;;
    esac
done


# while getopts ":p:v:" opt
# do
#     case $opt in
#         v)
#             echo "Version: $OPTARG"
#             version=$OPTARG
#             ;;
#         ?)
#             echo "Unkonw"
#             exit 1
#             ;;
#     esac
# done

