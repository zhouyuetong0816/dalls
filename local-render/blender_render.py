"""Import the exact website meshes and bake a Cycles plush studio photograph."""
import bpy, sys, json, math, base64, random, bmesh
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
source,target=map(Path,args[:2]);data=json.loads(source.read_text());design=data['design']
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
random.seed(41)
def rgba(h):
    c=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4 for v in c)+(1,)
def material(item,i):
    mat=bpy.data.materials.new(item['name']+str(i));mat.use_nodes=True;n=mat.node_tree.nodes;links=mat.node_tree.links;n.clear();p=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');links.new(p.outputs[0],out.inputs[0]);p.inputs['Base Color'].default_value=rgba(item['color']);p.inputs['Roughness'].default_value=item['roughness'];p.inputs['Sheen Weight'].default_value=.45
    if item.get('texture'):
        path=source.parent/('texture-'+str(i)+'.png');path.write_bytes(base64.b64decode(item['texture'].split(',',1)[1]));im=bpy.data.images.load(str(path));im.pack();tex=n.new('ShaderNodeTexImage');tex.image=im;links.new(tex.outputs['Color'],p.inputs['Base Color'])
    if item.get('plastic'):
        p.inputs['Roughness'].default_value=.16;p.inputs['Coat Weight'].default_value=1;p.inputs['Coat Roughness'].default_value=.1;p.inputs['Sheen Weight'].default_value=0;return mat
    noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=230;noise.inputs['Detail'].default_value=3;bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.012;links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],p.inputs['Normal']);return mat
objects=[]
for i,item in enumerate(data['scene']['meshes']):
    values=item['positions'];verts=[(values[j],-values[j+2],values[j+1]) for j in range(0,len(values),3)];indices=item.get('indices') or list(range(len(verts)));faces=[indices[j:j+3] for j in range(0,len(indices),3)]
    mesh=bpy.data.meshes.new(item['name']);mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(item['name'],mesh);bpy.context.collection.objects.link(obj);objects.append(obj)
    if item.get('uv'):
        uv=mesh.uv_layers.new();coords=item['uv']
        for poly in mesh.polygons:
            for li in poly.loop_indices:
                vi=mesh.loops[li].vertex_index;uv.data[li].uv=(coords[vi*2],coords[vi*2+1])
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);bm.to_mesh(mesh);bm.free()
    for poly in mesh.polygons:poly.use_smooth=True
    if item.get('region') and item['region']!='muzzle':
        boundary=set()
        counts={}
        for poly in mesh.polygons:
            for edge in poly.edge_keys:counts[edge]=counts.get(edge,0)+1
        for edge,count in counts.items():
            if count==1:boundary.update(edge)
        group=obj.vertex_groups.new(name='Interior only');interior=[v.index for v in mesh.vertices if v.index not in boundary]
        if interior:group.add(interior,1,'REPLACE')
        smooth=obj.modifiers.new('Soft sewn silhouette','SMOOTH');smooth.factor=.3;smooth.iterations=3;smooth.vertex_group=group.name
    if not item.get('facePart') and not item.get('region') and not item.get('accessType') and item['color'].lower() in ('#171717','#191817','#171613','#161412','#111111','#000000'):
        obj.location.y-=.07
    mat=material(item,i);mesh.materials.append(mat)
    region=item.get('region');m=design['materials'].get(region,{})
    fabric=m.get('fabric');pom=item.get('accessType')=='毛球';pile=m.get('pile',4)
    if fabric in ('短毛绒','长毛绒','羊羔绒','毛毡') or pom:
        bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.particle_system_add();ps=obj.particle_systems[-1];settings=ps.settings;settings.type='HAIR';settings.count=max(300,min(9000,int(sum(p.area for p in mesh.polygons)*1600)));settings.hair_length=(.025+pile*.005 if fabric=='短毛绒' else .06+pile*.014 if fabric=='长毛绒' else .055 if fabric=='羊羔绒' else .01) if not pom else .045
        if region=='muzzle':settings.hair_length=min(settings.hair_length,.035)
        settings.hair_step=4;settings.child_type='INTERPOLATED';settings.child_percent=12;settings.rendered_child_count=24;settings.root_radius=.0018;settings.tip_radius=.00015;settings.radius_scale=.6;settings.clump_factor=.08;settings.roughness_1=.025;settings.roughness_1_size=.3;settings.roughness_2=.015;settings.roughness_endpoint=.015
        if fabric=='羊羔绒':settings.kink='CURL';settings.kink_amplitude=.015;settings.kink_frequency=3;settings.clump_factor=.35
        # Texture coordinates on the surface carry the chosen pattern into the hairs.
        hair=bpy.data.materials.new('Fiber '+str(i));hair.use_nodes=True;hn=hair.node_tree.nodes;hl=hair.node_tree.links;hn.clear();out=hn.new('ShaderNodeOutputMaterial');bs=hn.new('ShaderNodeBsdfHairPrincipled');bs.parametrization='COLOR';bs.inputs['Color'].default_value=rgba(item['color']);bs.inputs['Roughness'].default_value=.48;bs.inputs['Radial Roughness'].default_value=.65
        if item.get('texture'):
            tx=hn.new('ShaderNodeTexImage');tx.image=next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE');hl.new(tx.outputs['Color'],bs.inputs['Color'])
        hl.new(bs.outputs[0],out.inputs[0]);mesh.materials.append(hair);settings.material=2;obj.select_set(False)
low=min(v.co.z for o in objects for v in o.data.vertices);high=max(v.co.z for o in objects for v in o.data.vertices);left=min(v.co.x for o in objects for v in o.data.vertices);right=max(v.co.x for o in objects for v in o.data.vertices)
center=Vector(((left+right)/2,0,(low+high)/2));extent=max(high-low,right-left)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,low-.08));floor=bpy.context.object;floor.name='Cream studio';mat=bpy.data.materials.new('Warm backdrop');mat.diffuse_color=(.64,.59,.51,1);mat.use_nodes=True;next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Base Color'].default_value=(.64,.59,.51,1);next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Roughness'].default_value=.85;floor.data.materials.append(mat)
def aim(o,pt):o.rotation_euler=(Vector(pt)-o.location).to_track_quat('-Z','Y').to_euler()
def light(name,loc,power,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;aim(o,center)
light('Large softbox',(-3,-4,6),650,4);light('Fill',(4,-2,3),280,3);light('Rim',(-1,3,5),800,3)
bpy.ops.object.camera_add(location=(center.x,-extent*2.8,center.z+extent*.12));camera=bpy.context.object;aim(camera,center);camera.data.type='ORTHO';camera.data.ortho_scale=extent*1.3;bpy.context.scene.camera=camera
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.cycles.max_bounces=7;scene.world.use_nodes=True;world_bs=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND');world_bs.inputs[0].default_value=(.75,.72,.67,1);world_bs.inputs[1].default_value=.5;scene.view_settings.view_transform='AgX';scene.render.resolution_x=scene.render.resolution_y=int(data.get('resolution',1600));scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(target);scene.render.threads_mode='FIXED';scene.render.threads=6
scene.render.film_transparent=True;scene.render.image_settings.color_mode='RGBA';floor.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(target.with_suffix('.blend')));bpy.ops.render.render(write_still=True)
frames=[];scene.render.resolution_x=scene.render.resolution_y=640;scene.cycles.samples=16
for frame in range(16):
    angle=frame*math.tau/16;camera.location=(center.x+math.sin(angle)*extent*2.8,-math.cos(angle)*extent*2.8,center.z+extent*.12);aim(camera,center)
    path=target.parent/(target.stem+'-angle-'+str(frame)+'.png');scene.render.filepath=str(path);bpy.ops.render.render(write_still=True);frames.append('/generated/'+path.name)
(target.parent/(target.stem+'.turntable.json')).write_text(json.dumps({'frames':frames}))

(target.parent/'latest-blender.json').write_text(json.dumps({'id':target.stem,'model':'Blender Cycles','status':'complete','imageUrl':'/generated/'+target.name,'design':design},ensure_ascii=False))
