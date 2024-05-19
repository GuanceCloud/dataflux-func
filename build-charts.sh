#!/bin/bash
# 此脚本用于打包Func charts 包
# 生产地址为 https://pubrepo.guance.com/chartrepo/func  func-prod-chart
# 测试地址为 https://registry.jiagouyun.com/chartrepo/func-test  func-test-chart
# param VERSION  1.6.7
# param IMAGETAG 镜像tag
# param REPO helm 仓库地址

VERSION=$1
IMAGETAG=$2
REPO=$3

helm_info(){
    helm repo ls
}

build_charts(){
  #sed -e "s,{{tag}},${IMAGETAG},g" charts/values.yaml > charts/func/values.yaml
  helm package charts/func --app-version ${IMAGETAG} --version ${VERSION}
}

push_charts(){
    helm cm-push func-${VERSION}.tgz ${REPO}
    rm -f func-${VERSION}.tgz
}

helm_info
build_charts
push_charts
