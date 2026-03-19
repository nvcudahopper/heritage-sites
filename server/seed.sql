-- Seed Data for Heritage Sites

-- Tags
INSERT INTO tags (name, category) VALUES
  ('四大石窟', 'group'),
  ('世界文化遗产', 'heritage'),
  ('丝绸之路', 'route'),
  ('全国重点文物保护单位', 'heritage'),
  ('佛教圣地', 'religion'),
  ('道教圣地', 'religion'),
  ('世界自然与文化双遗产', 'heritage')
ON CONFLICT (name) DO NOTHING;

-- Users
INSERT INTO users (name, nickname, email, avatar_url) VALUES
  ('访客', '默认用户', NULL, NULL),
  ('小明', '石窟爱好者', 'xm@example.com', NULL)
ON CONFLICT DO NOTHING;

-- Sites: 石窟
INSERT INTO sites (name, type, country, region, coordinates_lat, coordinates_lng, main_religion, founded_period, heritage_status, brief_intro, is_active_site, cover_image_url, thumbnail_image_url) VALUES
  ('莫高窟', 'cave', '中国', '甘肃敦煌', 40.0362, 94.8097, '佛教', '前秦（公元366年）', '世界文化遗产', '莫高窟又称千佛洞，坐落于河西走廊西端的敦煌市境内，始建于前秦宣昭帝建元二年（公元366年），历经十六国、北朝、隋、唐、五代、西夏、元等朝代的兴建修缮，形成规模宏大的石窟群。现存洞窟735个，壁画4.5万平方米、泥质彩塑2415尊，是世界上现存规模最大、内容最丰富的佛教艺术地。', false, 'https://images.unsplash.com/photo-1609665558965-8e4c789cd7c5?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1609665558965-8e4c789cd7c5?w=400&h=300&fit=crop'),
  ('云冈石窟', 'cave', '中国', '山西大同', 40.1097, 113.1323, '佛教', '北魏（公元460年）', '世界文化遗产', '云冈石窟位于山西省大同市西郊武州山南麓，依山开凿，东西绵延约一公里。现存主要洞窟45个，大小窟龛252个，石雕造像五万一千余尊。其中第20窟的露天大佛高13.7米，是云冈石窟的代表作。石窟造像气势宏伟，内容丰富多彩，被称为中国古代雕刻艺术的宝库。', false, 'https://images.unsplash.com/photo-1590123752840-cc32399d0e59?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1590123752840-cc32399d0e59?w=400&h=300&fit=crop'),
  ('龙门石窟', 'cave', '中国', '河南洛阳', 34.5644, 112.4696, '佛教', '北魏（公元493年）', '世界文化遗产', '龙门石窟位于河南省洛阳市南郊伊河两岸的龙门山与香山上，是中国石刻艺术宝库之一。开凿于北魏孝文帝迁都洛阳之际，之后历经东魏、西魏、北齐、隋、唐、五代的营造，南北长达1公里，今存有窟龛2345个，造像10万余尊，碑刻题记2800余品。其中卢舍那大佛为龙门石窟最大造像。', false, 'https://images.unsplash.com/photo-1591792111137-5b8219d5fad6?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1591792111137-5b8219d5fad6?w=400&h=300&fit=crop'),
  ('麦积山石窟', 'cave', '中国', '甘肃天水', 34.3509, 106.0012, '佛教', '后秦（公元384年）', '世界文化遗产', '麦积山石窟位于甘肃省天水市麦积区，因山形如麦垛而得名。石窟始建于后秦时期，大兴于北魏明元帝、太武帝时期，以精美的泥塑艺术闻名于世。现存窟龛194个，泥塑、石雕7800多件，壁画1000多平方米，被誉为「东方雕塑陈列馆」。', false, 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&h=300&fit=crop'),
  ('大足石刻', 'cave', '中国', '重庆大足', 29.7026, 105.7109, '佛教/道教/儒教', '唐末五代（公元892年）', '世界文化遗产', '大足石刻位于重庆市大足区境内，是唐末、宋初时期宗教摩崖石刻的杰作。造像始建于初唐，历经唐末至南宋，明清也有部分雕刻，以北山、宝顶山、南山、石篆山、石门山五处最为集中。大足石刻是中国晚期石窟艺术的代表，融佛教、道教、儒教三教造像于一体，以鲜明的民族化、世俗化特色著称。', false, 'https://images.unsplash.com/photo-1558431382-27e303142255?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1558431382-27e303142255?w=400&h=300&fit=crop'),
  ('法门寺', 'temple', '中国', '陕西扶风', 34.4442, 107.8952, '佛教', '东汉（公元68年）', '全国重点文物保护单位', '法门寺位于陕西省宝鸡市扶风县城北约10公里的法门镇，始建于东汉。1987年在修复宝塔时发现了唐代地宫，出土了佛指舍利以及大量唐代宫廷珍宝，震惊世界。法门寺因供奉佛祖释迦牟尼指骨舍利而闻名于世，被联合国教科文组织评为「世界第九大奇迹」。', true, 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop'),
  ('少林寺', 'temple', '中国', '河南登封', 34.5078, 112.9365, '佛教', '北魏太和十九年（公元495年）', '世界文化遗产', '少林寺位于河南省郑州市登封市嵩山五乳峰下，因坐落于嵩山腹地少室山茂密丛林之中而得名。始建于北魏太和十九年（495年），是中国佛教禅宗祖庭和中国功夫的发源地。寺内保存有大量珍贵的文物古迹，被列为全国重点文物保护单位。', true, 'https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=400&h=300&fit=crop'),
  ('寒山寺', 'temple', '中国', '江苏苏州', 31.3166, 120.5670, '佛教', '南朝梁天监年间（公元502-519年）', '全国重点文物保护单位', '寒山寺位于苏州市姑苏区，初名「妙利普明塔院」。因唐代诗人张继的《枫桥夜泊》一诗而名扬天下。「月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。」寺内古迹众多，有张继诗的石刻碑文、寒山与拾得的故事等。', true, 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop'),
  ('灵隐寺', 'temple', '中国', '浙江杭州', 30.2408, 120.1005, '佛教', '东晋咸和元年（公元326年）', '全国重点文物保护单位', '灵隐寺位于浙江省杭州市西湖西北面，背靠北高峰，面朝飞来峰，始建于东晋咸和元年（326年），距今已有约一千七百年的历史。灵隐寺是中国佛教著名寺院之一，也是杭州最负盛名的古刹。', true, 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop'),
  ('白马寺', 'temple', '中国', '河南洛阳', 34.7321, 112.5629, '佛教', '东汉永平十一年（公元68年）', '全国重点文物保护单位', '白马寺位于河南省洛阳市东郊，是中国第一座由官方营建的佛教寺院，被称为「中国第一古刹」。东汉明帝派使者西行求法，使者与天竺高僧摄摩腾、竺法兰以白马驮载佛经、佛像来到洛阳，建白马寺以安置。', true, 'https://images.unsplash.com/photo-1577037905339-6e6d8153c759?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1577037905339-6e6d8153c759?w=400&h=300&fit=crop'),
  ('东大寺', 'temple', '日本', '奈良', 34.6889, 135.8398, '佛教', '天平十五年（公元743年）', '世界文化遗产', '东大寺位于日本奈良市，是华严宗大本山。大佛殿（金堂）是世界最大的木造建筑之一，殿内供奉有卢舍那大佛坐像，高约15米。东大寺是全日本68所国分寺的总寺院，于1998年作为「古都奈良的文化财」被列入世界文化遗产。', true, 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop'),
  ('阿旃陀石窟', 'cave', '印度', '马哈拉施特拉邦', 20.5522, 75.7003, '佛教', '公元前2世纪', '世界文化遗产', '阿旃陀石窟位于印度马哈拉施特拉邦北部，是印度古代佛教文化的遗址。石窟群共30座，凿于公元前2世纪至公元6世纪之间，以精美的壁画和石雕闻名，是印度古代艺术的最高成就之一。1983年被列入世界文化遗产名录。', false, 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&h=675&fit=crop', 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop');

-- Site Tags (using subqueries to get IDs)
INSERT INTO site_tags (site_id, tag_id)
SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '莫高窟' AND t.name = '四大石窟'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '莫高窟' AND t.name = '世界文化遗产'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '莫高窟' AND t.name = '丝绸之路'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '莫高窟' AND t.name = '全国重点文物保护单位'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '云冈石窟' AND t.name = '四大石窟'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '云冈石窟' AND t.name = '世界文化遗产'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '云冈石窟' AND t.name = '全国重点文物保护单位'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '龙门石窟' AND t.name = '四大石窟'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '龙门石窟' AND t.name = '世界文化遗产'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '龙门石窟' AND t.name = '全国重点文物保护单位'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '麦积山石窟' AND t.name = '四大石窟'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '麦积山石窟' AND t.name = '世界文化遗产'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '麦积山石窟' AND t.name = '丝绸之路'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '麦积山石窟' AND t.name = '全国重点文物保护单位'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '大足石刻' AND t.name = '世界文化遗产'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '大足石刻' AND t.name = '全国重点文物保护单位'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '法门寺' AND t.name = '全国重点文物保护单位'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '法门寺' AND t.name = '佛教圣地'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '少林寺' AND t.name = '世界文化遗产'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '少林寺' AND t.name = '全国重点文物保护单位'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '少林寺' AND t.name = '佛教圣地'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '寒山寺' AND t.name = '全国重点文物保护单位'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '寒山寺' AND t.name = '佛教圣地'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '灵隐寺' AND t.name = '全国重点文物保护单位'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '灵隐寺' AND t.name = '佛教圣地'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '白马寺' AND t.name = '全国重点文物保护单位'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '白马寺' AND t.name = '佛教圣地'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '东大寺' AND t.name = '世界文化遗产'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '东大寺' AND t.name = '佛教圣地'
UNION ALL SELECT s.id, t.id FROM sites s, tags t WHERE s.name = '阿旃陀石窟' AND t.name = '世界文化遗产'
ON CONFLICT (site_id, tag_id) DO NOTHING;

-- Events for 莫高窟
INSERT INTO site_events (site_id, year_or_period, title, description, sort_order)
SELECT s.id, '前秦建元二年（公元366年）', '乐僔法师始凿第一窟', '前秦僧人乐僔路经三危山，忽见金光闪耀如万佛现世，遂于崖壁凿建第一座洞窟。', 1 FROM sites s WHERE s.name = '莫高窟'
UNION ALL SELECT s.id, '北魏至隋', '大规模开凿时期', '历经北魏、西魏、北周至隋代，洞窟数量大幅增长，壁画风格从西域风格逐渐融合中原特色。', 2 FROM sites s WHERE s.name = '莫高窟'
UNION ALL SELECT s.id, '唐代（618-907年）', '鼎盛时期', '唐代是莫高窟建设最繁盛时期，开凿洞窟千余个，壁画和彩塑达到最高艺术水准。', 3 FROM sites s WHERE s.name = '莫高窟'
UNION ALL SELECT s.id, '公元1900年', '藏经洞被发现', '道士王圆箓在清理积沙时偶然发现17号洞窟（藏经洞），内藏约五万件从4世纪到11世纪的经卷文书。', 4 FROM sites s WHERE s.name = '莫高窟'
UNION ALL SELECT s.id, '公元1961年', '被列为全国重点文物保护单位', '中华人民共和国国务院公布莫高窟为全国第一批重点文物保护单位。', 5 FROM sites s WHERE s.name = '莫高窟'
UNION ALL SELECT s.id, '公元1987年', '被列入世界文化遗产名录', '联合国教科文组织将莫高窟列入世界文化遗产名录。', 6 FROM sites s WHERE s.name = '莫高窟';

-- Events for 云冈石窟
INSERT INTO site_events (site_id, year_or_period, title, description, sort_order)
SELECT s.id, '北魏和平初年（公元460年）', '昙曜五窟开凿', '高僧昙曜主持开凿第16-20窟，即著名的「昙曜五窟」，以北魏五帝为原型雕刻五尊大佛。', 1 FROM sites s WHERE s.name = '云冈石窟'
UNION ALL SELECT s.id, '北魏太和年间（477-499年）', '大规模扩建', '孝文帝迁都前后，云冈石窟进行了大规模的扩建，形成了规模宏大的石窟群。', 2 FROM sites s WHERE s.name = '云冈石窟'
UNION ALL SELECT s.id, '公元2001年', '被列入世界文化遗产名录', '联合国教科文组织将云冈石窟列入世界文化遗产名录。', 3 FROM sites s WHERE s.name = '云冈石窟';

-- Events for 龙门石窟
INSERT INTO site_events (site_id, year_or_period, title, description, sort_order)
SELECT s.id, '北魏太和十七年（公元493年）', '孝文帝迁都洛阳始凿', '北魏孝文帝迁都洛阳后，开始在龙门伊水两岸开凿石窟。', 1 FROM sites s WHERE s.name = '龙门石窟'
UNION ALL SELECT s.id, '唐代（公元675年）', '奉先寺卢舍那大佛完工', '唐高宗时期，奉先寺大型摩崖像龛完工，主尊卢舍那大佛高17.14米，据传以武则天为蓝本雕刻。', 2 FROM sites s WHERE s.name = '龙门石窟'
UNION ALL SELECT s.id, '公元2000年', '被列入世界文化遗产名录', '联合国教科文组织将龙门石窟列入世界文化遗产名录。', 3 FROM sites s WHERE s.name = '龙门石窟';

-- Events for 法门寺
INSERT INTO site_events (site_id, year_or_period, title, description, sort_order)
SELECT s.id, '东汉明帝年间（公元68年）', '始建', '法门寺据传始建于东汉明帝时期，初名「阿育王寺」。', 1 FROM sites s WHERE s.name = '法门寺'
UNION ALL SELECT s.id, '唐代', '迎佛骨盛典', '唐代皇帝曾多次迎请法门寺佛骨舍利到长安供养，规模盛大。', 2 FROM sites s WHERE s.name = '法门寺'
UNION ALL SELECT s.id, '公元1987年', '唐代地宫发掘', '修复法门寺宝塔时发现唐代地宫，出土佛指舍利及两千余件唐代珍贵文物。', 3 FROM sites s WHERE s.name = '法门寺';

-- Relations
INSERT INTO site_relations (site_id, related_site_id, relation_type)
SELECT s1.id, s2.id, '同属洛阳佛教遗产' FROM sites s1, sites s2 WHERE s1.name = '龙门石窟' AND s2.name = '白马寺'
UNION ALL SELECT s1.id, s2.id, '同属河南佛教名胜' FROM sites s1, sites s2 WHERE s1.name = '龙门石窟' AND s2.name = '少林寺'
UNION ALL SELECT s1.id, s2.id, '同属丝绸之路石窟群' FROM sites s1, sites s2 WHERE s1.name = '莫高窟' AND s2.name = '麦积山石窟';

-- News
INSERT INTO news_links (site_id, title, source_name, url, published_date, summary)
SELECT s.id, '敦煌研究院发布2024年度莫高窟壁画保护报告', '光明日报', 'https://www.gmw.cn', '2024-12-15', '报告显示莫高窟壁画数字化工程已覆盖80%以上的洞窟。' FROM sites s WHERE s.name = '莫高窟'
UNION ALL SELECT s.id, '数字敦煌全球共享平台升级上线', '人民日报', 'https://www.people.com.cn', '2024-11-20', '升级后的平台提供更高分辨率的洞窟全景漫游体验。' FROM sites s WHERE s.name = '莫高窟'
UNION ALL SELECT s.id, '云冈石窟数字化保护项目取得新进展', '新华社', 'https://www.xinhua.com', '2024-10-08', '3D打印技术首次成功复制云冈石窟第12窟。' FROM sites s WHERE s.name = '云冈石窟';

-- Checkins
INSERT INTO checkins (user_id, site_id, visited_date, rating, note)
SELECT u.id, s.id, '2024-08-15', 5, '震撼，壁画的色彩和细节超乎想象。参观了几个特窟，九层楼的佛像让人肃然起敬。' FROM users u, sites s WHERE u.name = '访客' AND s.name = '莫高窟'
UNION ALL SELECT u.id, s.id, '2024-06-20', 4, '北魏的石雕非常有力量感，尤其是昙曜五窟的大佛。夏天去的，太阳很晒但值得。' FROM users u, sites s WHERE u.name = '访客' AND s.name = '云冈石窟'
UNION ALL SELECT u.id, s.id, '2024-09-01', 5, '卢舍那大佛的微笑至今令我难忘。建议春秋季去，可以坐游船在伊河上远眺石窟全景。' FROM users u, sites s WHERE u.name = '小明' AND s.name = '龙门石窟'
UNION ALL SELECT u.id, s.id, '2024-07-10', 4, '地宫的文物非常震撼，佛指舍利的安保很严格。寺院本身也很壮观。' FROM users u, sites s WHERE u.name = '访客' AND s.name = '法门寺'
UNION ALL SELECT u.id, s.id, '2024-10-05', 5, '国庆去的人很多，但还是值得。特窟需要额外预约，强烈推荐。' FROM users u, sites s WHERE u.name = '小明' AND s.name = '莫高窟';
