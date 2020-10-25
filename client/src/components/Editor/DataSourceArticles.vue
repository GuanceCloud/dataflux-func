<template>
  <div class="article-container" v-if="type in articles">
    <div class="article">
      <h1>{{ articles[type].name }}</h1>
      <table>
        <tbody>
          <tr v-for="d in articles[type].infoTable">
            <td>{{ d.label }}</td>
            <td v-if="d.value.indexOf('http') === 0"><a :href="d.value">{{ d.value.split('://')[1] }}</a></td>
            <td v-else>{{ d.value }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="Array.isArray(articles[type].summary)">
        <p v-for="p in articles[type].summary">{{ p }}</p>
      </div>
      <div v-else-if="articles[type].summary">
        <p>{{ articles[type].summary }}</p>
      </div>

      <div v-if="Array.isArray(articles[type].history)">
        <h3>历史</h3>
        <p v-for="p in articles[type].history">{{ p }}</p>
      </div>
      <div v-else-if="articles[type].history">
        <h3>历史</h3>
        <p>{{ articles[type].history }}</p>
      </div>

      <small v-if="articles[type].tip">{{ articles[type].tip }}</small>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataSourceArticles',
  components: {
  },
  watch: {
  },
  methods: {
  },
  computed: {
  },
  props: {
    type: String
  },
  data() {
    return {
      articles: {
        influxdb: {
          name: 'InfluxDB',
          infoTable: [
            {label: '开发者', value: 'InfluxData'},
            {label: '初始版本', value: '2013年9月24日'},
            {label: '编程语言', value: 'GO'},
            {label: '操作系统', value: '跨平台'},
            {label: '类型', value: '时序型数据库'},
            {label: '许可协议', value: 'MIT许可证'},
            {label: '网站', value: 'https://influxdata.com/time-series-platform/influxdb/'},
          ],
          summary: `InfluxDB是一个由InfluxData开发的开源时序型数据库
            它由Go写成，着力于高性能地查询与存储时序型数据。
            InfluxDB被广泛应用于存储系统的监控数据，IoT行业的实时数据等场景。`,
          history: `Errplane公司在2013年下半年开始以开源项目的形式开始了InfluxDB的开发。
            其目的是为了提供一个高性能的监控以及告警的解决方案。
            在2014年11月，Errplane获得了由梅菲尔德风险投资公司与Trinity Ventures领投的A轮投资，金额高达810万美元。
            在次年的2015年，Errplane正式更名为InfluxData Inc.，而更名后的InfluxData又分别于2016年9月，2018年2月获得了金额高达1600万美元和3500万美元的B轮，C轮投资。`,
          tip: `以上内容来自 https://zh.wikipedia.org/wiki/InfluxDB`,
        },
        mysql: {
          name: 'MySQL',
          infoTable: [
            {label: '原作者', value: 'MySQL AB'},
            {label: '开发者', value: '甲骨文公司'},
            {label: '初始版本', value: '1995年5月23日'},
            {label: '元代码库', value: 'https://github.com/mysql/mysql-server'},
            {label: '编程语言', value: 'C语言、C++'},
            {label: '操作系统', value: 'Linux、Solaris、macOS、Windows、FreeBSD'},
            {label: '类型', value: 'RDBMS'},
            {label: '许可协议', value: 'GNU通用公共许可证（第2版）专有软件'},
            {label: '网站', value: 'https://www.mysql.com/'},
          ],
          summary: [
            `MySQL原本是一个开放源码的关系数据库管理系统，原开发者为瑞典的MySQL AB公司，该公司于2008年被昇阳微系统（Sun Microsystems）收购。2009年，甲骨文公司（Oracle）收购昇阳微系统公司，MySQL成为Oracle旗下产品。`,
            `MySQL在过去由于性能高、成本低、可靠性好，已经成为最流行的开源数据库，因此被广泛地应用在Internet上的中小型网站中。随着MySQL的不断成熟，它也逐渐用于更多大规模网站和应用，比如维基百科、Google和Facebook等网站。非常流行的开源软件组合LAMP中的“M”指的就是MySQL。`,
            `但被甲骨文公司收购后，Oracle大幅调涨MySQL商业版的售价，且甲骨文公司不再支持另一个自由软件项目OpenSolaris的发展，因此导致自由软件社群们对于Oracle是否还会持续支持MySQL社群版（MySQL之中唯一的免费版本）有所隐忧，MySQL的创始人麦克尔·维德纽斯以MySQL为基础，成立分支计划MariaDB。而原先一些使用MySQL的开源软件逐渐转向MariaDB或其它的数据库。例如维基百科已于2013年正式宣布将从MySQL迁移到MariaDB数据库。`,
          ],
          history: `2008年1月16日，Sun（太阳微系统）正式收购MySQL。
            其目的是为了提供一个高性能的监控以及告警的解决方案。
            2009年4月20日，甲骨文公司宣布以每股9.50美元，74亿美元的总额收购Sun电脑公司。
            2013年6月18日，甲骨文公司修改MySQL授权协议，移除了GPL。但随后有消息称这是一个bug。`,
          tip: `以上内容来自 https://zh.wikipedia.org/wiki/MySQL`,
        },
        redis: {
          name: 'Redis',
          infoTable: [
            {label: '开发者', value: 'Salvatore Sanfilippo'},
            {label: '初始版本', value: '2009年5月10日'},
            {label: '源代码库', value: 'https://github.com/antirez/redis'},
            {label: '编程语言', value: 'ANSI C'},
            {label: '操作系统', value: '跨平台'},
            {label: '类型', value: '非关系型数据库'},
            {label: '许可协议', value: 'BSD'},
            {label: '网站', value: 'https://redis.io/'},
          ],
          summary: `Redis是一个使用ANSI C编写的开源、支持网络、基于内存、可选持久性的键值对存储数据库。从2015年6月开始，Redis的开发由Redis Labs赞助，而2013年5月至2015年6月期间，其开发由Pivotal赞助。在2013年5月之前，其开发由VMware赞助。根据月度排行网站DB-Engines.com的数据，Redis是最流行的键值对存储数据库。`,
          tip: `以上内容来自 https://zh.wikipedia.org/wiki/Redis`,
        },
        memcached: {
          name: 'Memcached',
          infoTable: [
            {label: '原作者', value: 'Brad Fitzpatrick'},
            {label: '源代码库', value: 'https://github.com/memcached/memcached'},
            {label: '语言', value: 'C语言'},
            {label: '类型', value: '缓存服务器'},
            {label: '许可协议', value: 'BSD许可证'},
            {label: '网站', value: 'http://memcached.org/'},
          ],
          summary: [
            `memcached是一套分布式的高速缓存系统，由LiveJournal的Brad Fitzpatrick开发，但当前被许多网站使用。这是一套开放源代码软件，以BSD license授权发布。`,
            `memcached缺乏认证以及安全管制，这代表应该将memcached服务器放置在防火墙后。`,
            `memcached的API使用三十二比特的循环冗余校验（CRC-32）计算键值后，将数据分散在不同的机器上。当表格满了以后，接下来新增的数据会以LRU机制替换掉。由于memcached通常只是当作缓存系统使用，所以使用memcached的应用程序在写回较慢的系统时（像是后端的数据库）需要额外的代码更新memcached内的数据。`,
          ],
          tip: `以上内容来自 https://zh.wikipedia.org/wiki/Memcached`,
        },
        df_dataway: {
          name: 'DataFlux DataWay',
          infoTable: [
            {label: '开发者', value: '上海驻云信息科技有限公司'},
            {label: '编程语言', value: 'GO'},
            {label: '官方网站', value: 'https://www.dataflux.cn/'},
          ],
          summary: [
            `DataWay 是 DataFlux 的一个组件，部署在用户环境中作为数据网关。主要提供两项功能：`,
            `1. 接收采集器发送的数据并上报 DataFlux 中心存储；`,
            `2. 处理采集数据并处理后上报 DataFlux 中心存储。`,
            `除了 DataFlux 提供的数据采集器可以向 DataWay 上报数据外，用户也可以使用 DataWay SDK 自行编写代码上报数据。SDK 有多种语言的实现可供使用。`,
          ],
          tip: `以上内容来自 DataFlux 白皮书`,
        },
        clickhouse: {
          name: 'ClickHouse',
          infoTable: [
            {label: '开发者', value: 'Yandex'},
            {label: '初始版本', value: '2016年6月15日'},
            {label: '编程语言', value: 'C++'},
            {label: '操作系统', value: 'Linux, macOS'},
            {label: '许可协议', value: 'Apache License 2.0'},
            {label: '网站', value: 'https://clickhouse.yandex/'},
          ],
          summary: [
            `ClickHouse是一个用于联机分析处理（OLAP）的开源列式数据库。`,
            `ClickHouse是由俄罗斯IT公司Yandex为Yandex.Metrica网络分析服务开发的。ClickHouse允许分析实时更新的数据。该系统以高性能为目标。`,
            `这个项目是在2016年6月发布的Apache许可证下的开源软件。`,
            `Yandex.Tank负载测试工具使用ClickHouse。Yandex.Market使用ClickHouse来监控网站的可访问性和KPI。ClickHouse还在CERN的LHCb实验中实现了对100亿个事件的元数据进行存储和处理，每个事件有超过1000个属性，Tinkoff Bank使用ClickHouse作为项目的数据存储。`,
          ],
          history: [
            `Yandex.Metrica以前使用一种经典的方法，即以聚合形式存储原始数据。这种方法可以帮助减少存储的数据量。然而，它有几个局限性和缺点：`,
            `1. 可用报表的列表必须是预先确定的，而且无法生成自定义报表。`,
            `2. 聚合之后，数据量可能会增加。当数据由大量键进行聚合或使用具有高基数的键（如URL）时，就会发生这种情况。`,
            `3. 对于具有不同聚合的报表，很难支持逻辑一致性。`,
            `另一种方法是存储未聚合的数据。处理原始数据需要高性能的系统，因为所有计算都是实时进行的。为了解决这个问题，需要一个能够处理整个互联网规模的分析数据的列式数据库。Yandex开始开发自己的列式数据库。 ClickHouse的第一个原型在2009年出现。2014年底，Yandex.Metrica 2.0版发布。新版本有一个用于创建自定义报告的接口，并使用ClickHouse存储和处理数据。`,
          ],
          tip: `以上内容来自 https://zh.wikipedia.org/wiki/ClickHouse`,
        },
        oracle: {
          name: 'Oracle数据库',
          infoTable: [
            {label: '开发者', value: '甲骨文公司'},
            {label: '初始版本', value: '1979'},
            {label: '编程语言', value: 'C'},
            {label: '操作系统', value: '跨平台'},
            {label: '类型', value: '关系数据库管理系统'},
            {label: '许可协议', value: '专有软件'},
            {label: '网站', value: 'http://oracle.com/database'},
          ],
          summary: [
            `Oracle Database，又名Oracle RDBMS，或简称Oracle。是甲骨文公司的一款关系数据库管理系统。到当前仍在数据库市场上占有主要份额。`,
            `劳伦斯·埃里森和他的朋友，之前的同事Bob Miner和Ed Oates在1977年创建了软件开发实验室咨询公司（SDL，Software Development Laboratories）。SDL开发了Oracle软件的最初版本。Oracle的名称来自于埃里森在Ampex工作时参加的一个由中央情报局创建的项目的代码名称`,
          ],
          tip: `以上内容来自 https://zh.wikipedia.org/wiki/Oracle数据库`,
        },
        sqlserver: {
          name: 'Microsoft SQL Server',
          infoTable: [
            {label: '开发者', value: 'Microsoft'},
            {label: '操作系统', value: 'Microsoft Windows'},
            {label: '类型', value: '关系数据库管理系统'},
            {label: '许可协议', value: 'Microsoft EULA'},
            {label: '网站', value: 'http://www.microsoft.com/zh-cn/server-cloud/products/sql-server/'},
          ],
          summary: [
            `Microsoft SQL Server(微软结构化查询语言服务器)是由美国微软公司所推出的关系数据库解决方案。`,
            `数据库的内置语言原本是采用美国标准局和国际标准组织所定义的SQL语言，但是微软公司对它进行了部分扩充而成为Transact-SQL。`,
            `几个初始版本适用于中小企业的数据库管理，但是近年来它的应用范围有所扩展，已经触及到大型、跨国企业的数据库管理。`,
          ],
          history: [
            `SQL Server一开始并不是微软自己研发的产品，而是当时为了要和IBM竞争时，与Sybase合作所产生的，其最早的发展者是Sybase，同时微软也和Sybase合作过SQL Server 4.2版本的研发，微软亦将SQL Server 4.2移植到Windows NT（当时为3.1版），在与Sybase终止合作关系后，自力开发出SQL Server 6.0版，往后的SQL Server即均由微软自行研发。`,
            `在与微软终止合作关系后，Sybase在Windows NT上的数据库产品原本称为Sybase SQL Server，后来改为现在的Sybase Adaptive Server Enterprise。`,
          ],
          tip: `以上内容来自 https://zh.wikipedia.org/wiki/Microsoft_SQL_Server`,
        },
        postgresql: {
          name: 'PostgreSQL',
          infoTable: [
            {label: '开发者', value: 'PostgreSQL Global Development Group'},
            {label: '初始版本', value: '1996年7月8日'},
            {label: '源代码库', value: 'https://github.com/postgres/postgres'},
            {label: '编程语言', value: 'C语言'},
            {label: '操作系统', value: 'Linux, Windows, FreeBSD, OpenBSD, NetBSD, macOS, AIX, HP/UX, Solaris 等'},
            {label: '系统平台', value: 'x86, x86_64, IA64, PowerPC, PowerPC 64, S/390, S/390x, Sparc, Sparc 64, ARM, MIPS, MIPSEL, PA-RISC 等'},
            {label: '类型', value: '关系数据库'},
            {label: '许可协议', value: 'PostgreSQL许可'},
            {label: '网站', value: 'https://www.postgresql.org/'},
          ],
          summary: [
            `PostgreSQL是开源的对象-关系数据库数据库管理系统，在类似BSD许可与MIT许可的PostgreSQL许可下发行。`,
            `PostgreSQL这个单字的拼法让有些人觉得很难读，特别是那些把SQL读作"sequel"的人。PostgreSQL开发者把它读作"post-gress-Q-L"。它也经常被简称为"postgres"。`,
          ],
          history: [
            `PostgreSQL经历了长时间的演变。该项目最初开始于在加利福尼亚大学伯克利分校的Ingres计划。这个计划的领导者迈克尔·斯通布雷克在1982年离开加利福尼亚大学伯克利分校去推进Ingres的商业化，但最后还是返回了学术界。在1985年返回伯克利之后，斯通布雷克开始了post-Ingres计划，致力于解决在1980年代早期所出现一些数据库系统存在的问题。Postgres和Ingres的代码库开始（并保持）完全分离。`,
            `从1986年开始，该项目组发表了一些描述这一系统基本原理的论文，并在1988年实现并运行了一个Demo版本。Postgres在1993年开始拥有大量用户，这些用户提供了大量的功能与优化建议。但是在发行了作为细节修正的版本4.0之后，Postgres计划就终止了。`,
            `尽管Postgres计划正式的终止了，BSD许可证（Postgres遵守BSD许可证发行）却使开发者们得以获取源代码并进一步开发系统。1994年，两个加利福尼亚大学伯克利分校的研究生 Andrew Yu和Jolly Chen 增加了一个SQL语言解释器来替代早先的基于Ingres的QUEL系统，创建了Postgres95。代码随后被发布到互联网上供全世界使用。Postgres95在1996年被重命名为PostgreSQL以便突出该数据库全新的SQL查询语言。`,
          ],
          tip: `以上内容来自 https://zh.wikipedia.org/wiki/PostgreSQL`,
        },
        mongodb: {
          name: 'mongoDB',
          infoTable: [
            {label: '开发者', value: 'MongoDB Inc.'},
            {label: '初始版本', value: '2009年2月11日'},
            {label: '源代码库', value: 'https://github.com/mongodb/mongo'},
            {label: '编程语言', value: 'C++, Go, JavaScript, Python'},
            {label: '操作系统', value: 'Windows 7/2008R2及以上、Linux、macOS 10.11及以上、Solaris、FreeBSD等'},
            {label: '系统平台', value: 'x86_64、ARM64及s390x，企业版额外支持PPC64LE'},
            {label: '语言', value: '英文'},
            {label: '类型', value: '面向文档的数据库'},
            {label: '许可协议', value: '服务器端公共许可证(SSPL)、商业许可证、语言驱动采用Apache许可证'},
            {label: '网站', value: 'https://www.mongodb.com'},
          ],
          summary: [
            `MongoDB是一种面向文档的数据库管理系统，用C++等语言撰写而成，以解决应用程序开发社区中的大量现实问题。MongoDB由MongoDB Inc.（当时是10gen团队）于2007年10月开发，2009年2月首度推出，现以服务器端公共许可（SSPL）分发。`,
          ],
          tip: `以上内容来自 https://zh.wikipedia.org/wiki/MongoDB`,
        },
        elasticsearch: {
          name: 'elasticsearch',
          infoTable: [
            {label: '原作者', value: 'Shay Banon'},
            {label: '开发者', value: 'Elastic NV'},
            {label: '初始版本', value: '2010年2月8日'},
            {label: '源代码库', value: 'https://github.com/elastic/elasticsearch'},
            {label: '编程语言', value: 'Java'},
            {label: '操作系统', value: 'Cross-platform'},
            {label: '类型', value: '搜索及索引'},
            {label: '许可协议', value: 'Apache License 2.0'},
            {label: '网站', value: 'https://www.elastic.co/products/elasticsearch'},
          ],
          summary: [
            `Elasticsearch是一个基于Lucene库的搜索引擎。它提供了一个分布式、支持多租户的全文搜索引擎，具有HTTP Web接口和无模式JSON文档。Elasticsearch是用Java开发的，并在Apache许可证下作为开源软件发布。官方客户端在Java、.NET（C#）、PHP、Python、Apache Groovy、Ruby和许多其他语言中都是可用的。根据DB-Engines的排名显示，Elasticsearch是最受欢迎的企业搜索引擎，其次是Apache Solr，也是基于Lucene。`,
            `Elasticsearch是与名为Logstash的数据收集和日志解析引擎以及名为Kibana的分析和可视化平台一起开发的。这三个产品被设计成一个集成解决方案，称为“Elastic Stack”（以前称为“ELK stack”）。`,
          ],
          history: [
            `Shay Banon在2004年创造了Elasticsearch的前身，称为Compass。在考虑Compass的第三个版本时，他意识到有必要重写Compass的大部分内容，以“创建一个可扩展的搜索解决方案”。因此，他创建了“一个从头构建的分布式解决方案”，并使用了一个公共接口，即HTTP上的JSON，它也适用于Java以外的编程语言。Shay Banon在2010年2月发布了Elasticsearch的第一个版本。`,
            `Elasticsearch BV成立于2012年，主要围绕Elasticsearch及相关软件提供商业服务和产品。2014年6月，在成立公司18个月后，该公司宣布通过C轮融资筹集7000万美元。这轮融资由新企业协会(NEA)牵头。其他投资者包括Benchmark Capital和Index Ventures。这一轮融资总计1.04亿美元。`,
            `2015年3月，Elasticsearch公司更名为Elastic。`,
          ],
          tip: `以上内容来自 https://zh.wikipedia.org/wiki/Elasticsearch`,
        },
        nsq: {
          name: 'NSQ',
          infoTable: [
            {label: '源代码库', value: 'https://github.com/nsqio/nsq'},
            {label: '编程语言', value: 'Golang'},
            {label: '类型', value: '消息队列'},
            {label: '许可协议', value: 'MIT'},
            {label: '网站', value: 'https://nsq.io/'},
          ],
          summary: [
            `NSQ 是一个实时分布式消息传递平台,旨在在规模、处理 每天数十亿的消息。`,
          ],
          tip: `以上内容来自 https://baike.baidu.com/item/nsq`,
        },
      }
    }
  },
  created() {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.article-container {
/*  transform-style: preserve-3d;
  perspective: 800px;*/
  float: right;
  padding-right: 30px;
}
.article {
  /*transform: rotateY(-15deg);*/
  font-size: small;
  color: grey;
  max-width: 350px;
}
.article table {
  border-collapse: collapse;
  background-color: #f8f9fa;
  border: 1px lightgrey solid;
  width: 100%;
}
.article td {
  padding: 3px;
}
.article td:first-child {
  width: 80px;
}
.article p {
  line-height: 22px;
}
.article h1,
.article h2,
.article h3 {
  border-bottom: 1px lightgrey solid;
}
</style>
