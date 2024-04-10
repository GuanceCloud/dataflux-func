#!/bin/bash


function auto_tag(){
  lastTag=$(git tag --list | grep -E "^${1}" | sort -V | tail -1)

  [[ ${#lastTag} > 0 ]] && {
    v=(${lastTag//_/ })
    v_main=${v[0]}_${v[1]}

    # 当前版本的 tag 已经存在，后续版本数字递增1
    releaseCount=$[10#${lastTag:${#v_main} + 1:2} + 101]
    releaseCount=${releaseCount:1:2}

    newTag=${v_main}_${releaseCount}
  } || {
    newTag=${1}_01
  }

  newTag=${newTag//[\.\/]/_}
  git tag $newTag
  git push --tag

  echo $newTag
}

git fetch --tag
while getopts ":fpr" opt; do
  case ${opt} in
    f )
      lastReleaseTag=$(git tag --list | grep -E "^release_" | sort -V | tail -1)
      auto_tag $lastReleaseTag
      ;;
    p )
      auto_tag pre_$(date +%Y%m%d)
      ;;
    r )
      auto_tag release_$(date +%Y%m%d)
      ;;
    \? )
      echo "支持的选项: "
      echo "  -f  在最后的生产版本上打一个 Bug 修复镜像"
      echo "  -p  打预发镜像"
      echo "  -r  打生产发布镜像"
      ;;
  esac
done
