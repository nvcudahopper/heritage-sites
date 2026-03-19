import pg from 'pg';
const { Client } = pg;

const client = new Client('postgresql://neondb_owner:npg_7xPlZCq5BkFY@ep-bold-glade-a1e0w900-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
await client.connect();

// Tag IDs:
// 1=四大石窟, 2=世界文化遗产, 3=丝绸之路, 4=全国重点文物保护单位, 5=佛教圣地, 6=道教圣地, 7=世界自然与文化双遗产

const newSites = [
  {
    name: '天梯山石窟',
    type: 'cave',
    country: '中国',
    region: '甘肃·武威',
    lat: 37.565119, lng: 102.740792,
    main_religion: '佛教',
    founded_period: '北凉',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '天梯山石窟始凿于北凉时期，是中国最早见于史册记载的皇家石窟，被誉为"石窟之祖"。现存3层19处洞窟，保存佛像100多尊、壁画数百平方米，创立了"凉州模式"，对云冈、龙门等石窟产生重要影响。',
    tags: [4, 5, 3] // 全国重点文物保护单位, 佛教圣地, 丝绸之路
  },
  {
    name: '马蹄寺石窟',
    type: 'cave',
    country: '中国',
    region: '甘肃·张掖',
    lat: 38.4843, lng: 100.4173,
    main_religion: '佛教',
    founded_period: '十六国北凉',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '马蹄寺石窟群开凿于十六国北凉时期，距今1600多年历史，由马蹄南寺、北寺、千佛洞、金塔寺等七部分组成，总计70余窟龛。以"三十三天"石窟宝塔形排列和金塔寺大型肉雕飞天著称，是河西走廊三大石窟艺术宝库之一。',
    tags: [4, 5, 3]
  },
  {
    name: '西千佛洞',
    type: 'cave',
    country: '中国',
    region: '甘肃·敦煌',
    lat: 40.1797, lng: 94.2583,
    main_religion: '佛教',
    founded_period: '北魏',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '西千佛洞位于敦煌莫高窟西侧党河谷崖壁，现存22窟，始凿于北魏，保存彩塑34身、壁画800余平方米。其艺术风格与莫高窟相近但具特色，隋代圆形帐窟形制为敦煌石窟孤例，与莫高窟互补构成敦煌石窟艺术。',
    tags: [4, 5, 3]
  },
  {
    name: '通天岩石窟',
    type: 'cave',
    country: '中国',
    region: '江西·赣州',
    lat: 25.92083, lng: 114.90278,
    main_religion: '佛教',
    founded_period: '唐代',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '通天岩石窟是中国南方最大、地理位置最南端的石窟群，被誉为"江南第一石窟"。开凿于唐朝，兴盛于北宋，现存窟龛315处、造像359尊及摩崖石刻128品，兼具丹霞地貌与丰富文物价值。',
    tags: [4, 5]
  },
  {
    name: '万佛堂石窟',
    type: 'cave',
    country: '中国',
    region: '辽宁·锦州',
    lat: 41.57278, lng: 121.15417,
    main_religion: '佛教',
    founded_period: '北魏',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '万佛堂石窟是中国东北地区年代最早、规模最大的石窟群，现存16窟、石刻造像近500尊。始建于北魏太和二十三年（499年），以中心柱窟、交脚弥勒像、元景造像碑等为代表，具有重要的佛教艺术和历史价值。',
    tags: [4, 5]
  },
  {
    name: '驼山石窟',
    type: 'cave',
    country: '中国',
    region: '山东·青州',
    lat: 36.648956, lng: 118.430852,
    main_religion: '佛教',
    founded_period: '北周至唐代',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '驼山石窟是中国东部最大的摩崖造像群，共有大小石窟五处、佛像638尊，开凿于北周至中唐时期。造像题材多为西方三圣像、千佛像等，隋唐时期雕刻技艺精湛，保存完好。',
    tags: [4, 5]
  },
  {
    name: '皇泽寺石窟',
    type: 'cave',
    country: '中国',
    region: '四川·广元',
    lat: 32.44111, lng: 105.81111,
    main_religion: '佛教',
    founded_period: '北周',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '皇泽寺石窟位于嘉陵江西岸乌龙山脚下，现存龛窟50个、造像千余尊，始凿于北周，盛于唐代。石窟艺术精美，融合多朝代风格，与敦煌莫高窟相似，为先开窟后建寺，是研究四川佛教艺术的重要遗址。',
    tags: [4, 5]
  },
  {
    name: '巴中南龛石窟',
    type: 'cave',
    country: '中国',
    region: '四川·巴中',
    lat: 31.8469, lng: 106.7563,
    main_religion: '佛教',
    founded_period: '隋唐',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '巴中南龛石窟是巴中境内规模最大、保存最完好的石窟，现存176龛、2700余尊造像，以唐代佛教石刻艺术著称。始凿于隋，盛于唐，融合中原与西域风格，草鞋天王、双头瑞佛等独特造像具有重要的历史艺术价值。',
    tags: [4, 5]
  },
  {
    name: '法华寺石窟',
    type: 'cave',
    country: '中国',
    region: '云南·安宁',
    lat: 24.9206, lng: 102.5326,
    main_religion: '佛教',
    founded_period: '宋大理国时期',
    heritage_status: '云南省重点文物保护单位',
    brief_intro: '法华寺石窟位于云南安宁市洛阳山上，为宋大理国时期雕刻的石窟群，共29窟，主要造像包括十八罗汉、地藏菩萨及长4.8米的释迦牟尼涅槃卧佛像。以禅宗造像为主，对研究云南佛教艺术及民俗具有重要价值。',
    tags: [5]
  },
  {
    name: '栖霞山千佛崖',
    type: 'cave',
    country: '中国',
    region: '江苏·南京',
    lat: 32.15361, lng: 118.95806,
    main_religion: '佛教',
    founded_period: '南齐（489年）',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '栖霞山千佛崖是中国唯一的南朝石窟，始凿于南齐永明七年（489年），历梁、宋、明各代增刻，现存佛龛294座、佛像515尊。以三圣殿为主的大型龛窟规模宏伟，保存有珍贵的飞天壁画，被誉为"江南云冈"。',
    tags: [4, 5]
  },
  {
    name: '钟山石窟',
    type: 'cave',
    country: '中国',
    region: '陕西·子长',
    lat: 37.17306, lng: 109.52861,
    main_religion: '佛教',
    founded_period: '北宋',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '钟山石窟位于陕西省子长市安定镇钟山南麓，现存五窟，主窟内有16尊高2-3米圆雕佛像及万余尊浮雕小佛像，被誉为"陕北敦煌"。雕刻艺术精湛，融合宋代风格，是研究宋代石窟艺术的重要遗存。',
    tags: [4, 5]
  },
  {
    name: '克孜尔千佛洞',
    type: 'cave',
    country: '中国',
    region: '新疆·拜城',
    lat: 41.78444, lng: 82.50472,
    main_religion: '佛教',
    founded_period: '公元3世纪',
    heritage_status: '全国重点文物保护单位·世界文化遗产',
    brief_intro: '克孜尔千佛洞是中国开凿最早、位置最西的大型佛教石窟群，现存编号石窟236窟，遗存约4000平方米壁画。壁画内容丰富，融合犍陀罗艺术风格，具有鲜明的龟兹特色，对中亚和中原佛教艺术影响深远。',
    tags: [2, 4, 5, 3] // 世界文化遗产, 全国重点文物保护单位, 佛教圣地, 丝绸之路
  },
  {
    name: '炳灵寺石窟',
    type: 'cave',
    country: '中国',
    region: '甘肃·永靖',
    lat: 35.80551, lng: 103.04438,
    main_religion: '佛教',
    founded_period: '西秦',
    heritage_status: '全国重点文物保护单位·世界文化遗产',
    brief_intro: '炳灵寺石窟位于黄河岸边陡峭崖壁上，始建于西秦时期，现存窟龛216个、造像815尊、壁画1000余平方米。以第169窟西秦最早纪年造像和第172窟27米高北魏坐佛闻名，被誉为"中国石窟的百科全书"。',
    tags: [2, 4, 5, 3]
  },
  {
    name: '榆林窟',
    type: 'cave',
    country: '中国',
    region: '甘肃·瓜州',
    lat: 40.05778, lng: 95.93333,
    main_religion: '佛教',
    founded_period: '唐代',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '榆林窟位于甘肃省瓜州县榆林河峡谷两岸崖壁，现存43个洞窟，为敦煌莫高窟的"姊妹窟"，以唐、五代、宋、西夏、元时期壁画和彩塑闻名，保存状况良好，艺术风格丰富独特，尤其西夏作品独具特色。',
    tags: [4, 5, 3]
  },
  {
    name: '响堂山石窟',
    type: 'cave',
    country: '中国',
    region: '河北·邯郸',
    lat: 36.5337, lng: 114.1549,
    main_religion: '佛教',
    founded_period: '北齐',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '响堂山石窟分北响堂、南响堂和小响堂，现存16座石窟、450余龛、5000余尊造像，是河北省最大石窟群。始凿于北齐文宣帝年间，以独特的塔形窟、"曹衣出水"衣纹和北齐丰满造像风格著称，为中国三大皇家石窟之一。',
    tags: [4, 5]
  },
  {
    name: '须弥山石窟',
    type: 'cave',
    country: '中国',
    region: '宁夏·固原',
    lat: 36.280479, lng: 105.986244,
    main_religion: '佛教',
    founded_period: '北魏',
    heritage_status: '全国重点文物保护单位',
    brief_intro: '须弥山石窟是中国十大石窟之一，始凿于北魏，共有132处石窟，分布绵延1500米，以北朝至唐代佛教造像著称。5号窟大佛高达20.6米为最大，艺术成就可媲美云冈、龙门，是丝绸之路重要佛教圣地。',
    tags: [4, 5, 3]
  }
];

let insertedCount = 0;
for (const site of newSites) {
  // Insert site
  const result = await client.query(`
    INSERT INTO sites (name, type, country, region, coordinates_lat, coordinates_lng, main_religion, founded_period, heritage_status, brief_intro, is_active_site)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
    RETURNING id
  `, [site.name, site.type, site.country, site.region, site.lat, site.lng, site.main_religion, site.founded_period, site.heritage_status, site.brief_intro]);
  
  const siteId = result.rows[0].id;
  
  // Insert tag associations
  for (const tagId of site.tags) {
    await client.query(`INSERT INTO site_tags (site_id, tag_id) VALUES ($1, $2)`, [siteId, tagId]);
  }
  
  insertedCount++;
  console.log(`✓ ${site.name} (ID: ${siteId}) - ${site.tags.length} tags`);
}

console.log(`\nDone! Inserted ${insertedCount} new sites.`);

// Verify total
const total = await client.query('SELECT COUNT(*) as count FROM sites');
console.log(`Total sites in database: ${total.rows[0].count}`);

await client.end();
