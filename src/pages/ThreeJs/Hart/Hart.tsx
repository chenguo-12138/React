import { useEffect, useRef } from "react";
import styles from "./Hart.module.less";
import {
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  DirectionalLight,
  AmbientLight,
  Color,
  Group,
  MathUtils,
  Shape,
  ExtrudeGeometry,
  Vector2,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
  PointLight,
  FogExp2,
  SphereGeometry,
  AdditiveBlending,
  Points,
  PointsMaterial,
  BufferAttribute,
  MeshPhongMaterial,
  DoubleSide,
} from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

// 定义几何体类型
interface GeometryObject {
  mesh: Mesh;
  rotationSpeed: {
    x: number;
    y: number;
    z: number;
  };
  floatSpeed?: number;
  initialY?: number;
}

const WebGl = () => {
  // 使用useRef存储Three.js对象
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const geometriesRef = useRef<GeometryObject[]>([]);
  const groupRef = useRef<Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const particlesRef = useRef<Points | null>(null);
  const fontRef = useRef<any>(null);

  // 要创建的3D字母
  const letters = "BKB";

  // 创建随机位置 - 使用球坐标系分布，确保更均匀地填充空间
  const getRandomPosition = (minRadius: number = 5, maxRadius: number = 20) => {
    // 随机半径
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    // 随机角度
    const theta = Math.random() * Math.PI * 2; // 水平角 (0-2π)
    const phi = Math.acos(2 * Math.random() - 1); // 垂直角 (0-π)

    // 转换为笛卡尔坐标
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi),
    };
  };

  // 创建随机旋转速度
  const getRandomRotationSpeed = () => {
    return {
      x: MathUtils.randFloatSpread(0.03),
      y: MathUtils.randFloatSpread(0.03),
      z: MathUtils.randFloatSpread(0.03),
    };
  };

  // 创建随机大小
  const getRandomSize = () => {
    return Math.random() * 0.8 + 0.4; // 0.4 到 1.2 之间
  };

  // 创建2D心形形状
  const createHeartShape = (size: number = 1) => {
    const shape = new Shape();

    // 心形曲线参数方程
    const heartCurve = (t: number, size: number) => {
      t *= 2 * Math.PI;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      return new Vector2((x * size) / 16, (-y * size) / 16);
    };

    // 绘制心形轮廓
    const segments = 50;
    const firstPoint = heartCurve(0, size);
    shape.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i <= segments; i++) {
      const point = heartCurve(i / segments, size);
      shape.lineTo(point.x, point.y);
    }

    return shape;
  };

  // 创建3D心形几何体 (使用挤出)
  const createHeartGeometry = (size: number = 1) => {
    const heartShape = createHeartShape(size);

    const extrudeSettings = {
      depth: size * 0.5,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: size * 0.1,
      bevelThickness: size * 0.1,
    };

    return new ExtrudeGeometry(heartShape, extrudeSettings);
  };

  // 创建3D心形几何体 (使用顶点)
  const createHeartVertexGeometry = (size: number = 1) => {
    // 创建一个空的几何体
    const geometry = new BufferGeometry();

    // 心形参数方程 (3D版本)
    const heartFunction = (u: number, v: number, target: Vector3) => {
      u *= Math.PI;
      v *= 2 * Math.PI;

      const x = Math.sin(u) * Math.cos(v);
      const y = 0.8 * Math.cos(u) + 0.2 * Math.cos(2 * u) * Math.cos(3 * v);
      const z = Math.sin(u) * Math.sin(v);

      // 调整形状使其更像心形
      const scale = 1 - 0.5 * Math.sin(u);
      target.set(
        x * scale * size,
        y * size * 1.2 - size * 0.5, // 上移一点
        z * scale * size
      );
    };

    // 生成顶点
    const vertices = [];
    const indices = [];

    const segmentsU = 24;
    const segmentsV = 24;

    // 生成顶点
    for (let i = 0; i <= segmentsU; i++) {
      const u = i / segmentsU;

      for (let j = 0; j <= segmentsV; j++) {
        const v = j / segmentsV;

        const vertex = new Vector3();
        heartFunction(u, v, vertex);
        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }

    // 生成面索引
    for (let i = 0; i < segmentsU; i++) {
      for (let j = 0; j < segmentsV; j++) {
        const a = i * (segmentsV + 1) + j;
        const b = a + 1;
        const c = a + (segmentsV + 1);
        const d = c + 1;

        // 两个三角形组成一个四边形面
        indices.push(a, c, b);
        indices.push(c, d, b);
      }
    }

    // 设置顶点和索引
    geometry.setIndex(indices);
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));

    // 计算法线
    geometry.computeVertexNormals();

    return geometry;
  };

  // 创建红色爱心材质
  const createHeartMaterial = () => {
    // 红色爱心的基础颜色范围
    const heartColors = [
      new Color(0xff0000), // 纯红色
      new Color(0xff1a1a), // 亮红色
      new Color(0xff3333), // 浅红色
      new Color(0xcc0000), // 深红色
      new Color(0xff6666), // 粉红色
    ];

    // 随机选择一个红色
    const baseColor =
      heartColors[Math.floor(Math.random() * heartColors.length)];

    return new MeshStandardMaterial({
      color: baseColor,
      metalness: 0.2,
      roughness: 0.3,
      flatShading: false,
      emissive: new Color(baseColor).multiplyScalar(0.2), // 添加自发光效果
    });
  };

  // 创建3D字母
  const createLetters = (scene: Scene) => {
    // 使用FontLoader加载字体
    const loader = new FontLoader();

    // 加载字体文件
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        // 为每个字母创建一个3D对象
        for (let i = 0; i < letters.length; i++) {
          const letter = letters[i];

          // 创建字母几何体
          const letterGeometry = new TextGeometry(letter, {
            font: font,
            size: 2.5,
            depth: 0.8,
            curveSegments: 5,
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.1,
            bevelSegments: 3,
          });

          // 创建随机颜色的材质
          const hue = Math.random();
          const letterMaterial = new MeshPhongMaterial({
            color: new Color().setHSL(hue, 0.8, 0.5),
            emissive: new Color().setHSL(hue, 0.8, 0.3),
            emissiveIntensity: 0.5,
            specular: 0xffffff,
            shininess: 100,
            side: DoubleSide,
          });

          // 创建字母网格
          const letterMesh = new Mesh(letterGeometry, letterMaterial);

          // 计算字母的边界盒，用于居中
          letterGeometry.computeBoundingBox();

          // 根据字母在单词中的位置放置
          const spacing = 3; // 字母间距
          const totalWidth = (letters.length - 1) * spacing;
          const x = (i - (letters.length - 1) / 2) * spacing;
          const y = 0;
          const z = 0;

          letterMesh.position.set(x, y, z);

          // 随机旋转
          letterMesh.rotation.x = Math.random() * 0.2 - 0.1;
          letterMesh.rotation.y = Math.random() * 0.2 - 0.1;
          letterMesh.rotation.z = Math.random() * 0.2 - 0.1;

          // 添加到场景
          scene.add(letterMesh);

          // 添加到几何体引用，使其也有动画效果
          geometriesRef.current.push({
            mesh: letterMesh,
            rotationSpeed: {
              x: MathUtils.randFloatSpread(0.01),
              y: MathUtils.randFloatSpread(0.01),
              z: MathUtils.randFloatSpread(0.01),
            },
            floatSpeed: 0.1 + Math.random() * 0.2, // 浮动速度
            initialY: letterMesh.position.y, // 记录初始Y位置
          });
        }
      }
    );
  };

  // 创建粒子系统
  const createParticles = () => {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color = new Color();

    for (let i = 0; i < particleCount; i++) {
      // 球形分布
      const radius = 30 * Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const i3 = i * 3;
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // 粒子颜色 - 从白色到粉红色
      const colorFactor = Math.random();
      color.setRGB(1, 0.6 + 0.4 * colorFactor, 0.7 + 0.3 * colorFactor);

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // 粒子大小
      sizes[i] = Math.random() * 2 + 0.5;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.setAttribute("size", new BufferAttribute(sizes, 1));

    const material = new PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    });

    return new Points(geometry, material);
  };

  // 创建各种爱心几何体
  const createHearts = (group: Group) => {
    const geometries: GeometryObject[] = [];

    // 爱心数量
    const heartCount = 120;

    for (let i = 0; i < heartCount; i++) {
      const size = getRandomSize();

      // 随机选择一种心形几何体类型
      const useVertexHeart = Math.random() > 0.5;
      const geometry = useVertexHeart
        ? createHeartVertexGeometry(size)
        : createHeartGeometry(size);

      const material = createHeartMaterial();

      const heart = new Mesh(geometry, material);

      // 使用球坐标分布，但避开中央区域
      let position;
      if (Math.random() < 0.9) {
        // 90%的爱心分布在外围
        position = getRandomPosition(8, 25); // 最小半径增加，避开中央
      } else {
        position = getRandomPosition(3, 7); // 少量爱心在中央附近
      }
      heart.position.set(position.x, position.y, position.z);

      // 随机初始旋转
      heart.rotation.x = Math.random() * Math.PI * 2;
      heart.rotation.y = Math.random() * Math.PI * 2;
      heart.rotation.z = Math.random() * Math.PI * 2;

      // 随机缩放变化
      const scale = 0.5 + Math.random() * 1.5;
      heart.scale.set(scale, scale, scale);

      group.add(heart);

      // 添加浮动效果的参数
      geometries.push({
        mesh: heart,
        rotationSpeed: getRandomRotationSpeed(),
        floatSpeed: 0.2 + Math.random() * 0.8, // 浮动速度
        initialY: heart.position.y, // 记录初始Y位置
      });
    }

    // 添加一些发光点光源
    for (let i = 0; i < 8; i++) {
      const position = getRandomPosition(5, 15);
      const light = new PointLight(new Color(0xff8888).getHex(), 0.8, 10);
      light.position.set(position.x, position.y, position.z);
      group.add(light);

      // 创建一个小球体作为光源的可视化
      const lightSphere = new Mesh(
        new SphereGeometry(0.2, 16, 16),
        new MeshStandardMaterial({
          color: 0xff8888,
          emissive: 0xff8888,
          emissiveIntensity: 1,
        })
      );
      lightSphere.position.copy(light.position);
      group.add(lightSphere);
    }

    // 添加一个中央点光源照亮字母
    const centerLight = new PointLight(0xffffff, 1.5, 20);
    centerLight.position.set(0, 0, 5);
    group.add(centerLight);

    return geometries;
  };

  // 初始化Three.js场景
  const initThreeJs = () => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new Scene();
    scene.background = new Color(0x080010); // 更深的背景色

    // 添加雾效，增加深度感
    scene.fog = new FogExp2(0x080010, 0.02);

    sceneRef.current = scene;

    // 创建相机
    const container = containerRef.current;
    const aspectRatio = container.clientWidth / container.clientHeight;
    const camera = new PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.z = 30; // 增加相机距离以查看更多对象
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = 3001; // sRGBEncoding
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 添加光源
    // 环境光
    const ambientLight = new AmbientLight(0x331122, 0.4); // 暗红色环境光
    scene.add(ambientLight);

    // 主光源 - 白色
    const directionalLight1 = new DirectionalLight(0xffffff, 1.0);
    directionalLight1.position.set(2, 2, 5);
    scene.add(directionalLight1);

    // 辅助光源 - 暖色调
    const directionalLight2 = new DirectionalLight(0xffcccc, 0.8);
    directionalLight2.position.set(-5, 1, -2);
    scene.add(directionalLight2);

    // 辅助光源 - 冷色调
    const directionalLight3 = new DirectionalLight(0xccccff, 0.5);
    directionalLight3.position.set(0, -5, 2);
    scene.add(directionalLight3);

    // 创建一个组来容纳所有几何体
    const group = new Group();
    scene.add(group);
    groupRef.current = group;

    // 创建爱心几何体并添加到场景
    const geometries = createHearts(group);
    geometriesRef.current = geometries;

    // 添加粒子系统
    const particles = createParticles();
    scene.add(particles);
    particlesRef.current = particles;

    // 创建3D字母
    createLetters(scene);

    // 初始渲染
    renderer.render(scene, camera);
  };

  // 动画循环
  const animate = () => {
    if (
      !rendererRef.current ||
      !sceneRef.current ||
      !cameraRef.current ||
      !groupRef.current ||
      !particlesRef.current
    )
      return;

    // 更新时间
    timeRef.current += 0.01;
    const time = timeRef.current;

    // 旋转整个组
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }

    // 更新每个几何体的旋转和位置
    geometriesRef.current.forEach((obj) => {
      // 旋转
      obj.mesh.rotation.x += obj.rotationSpeed.x;
      obj.mesh.rotation.y += obj.rotationSpeed.y;
      obj.mesh.rotation.z += obj.rotationSpeed.z;

      // 浮动效果
      if (obj.initialY !== undefined && obj.floatSpeed) {
        obj.mesh.position.y =
          obj.initialY + Math.sin(time * obj.floatSpeed) * 0.5;
      }
    });

    // 更新粒子系统
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0005;

      // 脉动效果
      const sizes = particlesRef.current.geometry.attributes.size;
      for (let i = 0; i < sizes.count; i++) {
        sizes.array[i] =
          (0.5 + Math.sin(time * 0.3 + i * 0.1) * 0.5) *
          (Math.random() * 2 + 0.5);
      }
      sizes.needsUpdate = true;
    }

    // 相机轻微运动
    cameraRef.current.position.x = Math.sin(time * 0.1) * 2;
    cameraRef.current.position.y = Math.cos(time * 0.1) * 2;
    cameraRef.current.lookAt(0, 0, 0);

    // 渲染场景
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // 请求下一帧动画
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // 处理窗口大小变化
  const handleResize = () => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current)
      return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 更新相机
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();

    // 更新渲染器
    rendererRef.current.setSize(width, height);
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  useEffect(() => {
    // 初始化
    initThreeJs();

    // 开始动画循环
    animationFrameRef.current = requestAnimationFrame(animate);

    // 添加窗口大小变化监听
    window.addEventListener("resize", handleResize);

    // 清理函数
    return () => {
      // 取消动画帧
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // 移除事件监听
      window.removeEventListener("resize", handleResize);

      // 清理Three.js资源
      if (rendererRef.current) {
        const container = containerRef.current;
        container?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      // 清理所有几何体和材质
      geometriesRef.current.forEach((obj) => {
        obj.mesh.geometry.dispose();
        if (obj.mesh.material instanceof MeshStandardMaterial) {
          obj.mesh.material.dispose();
        }
      });

      // 清理粒子系统
      if (particlesRef.current) {
        particlesRef.current.geometry.dispose();
        if (particlesRef.current.material instanceof PointsMaterial) {
          particlesRef.current.material.dispose();
        }
      }
    };
  }, []);

  return <div ref={containerRef} className={styles.webgl}></div>;
};

export default WebGl;
