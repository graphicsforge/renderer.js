# ##### BEGIN GPL LICENSE BLOCK #####
#
#    This program is free software; you can redistribute it and/or
#    modify it under the terms of the GNU General Public License
#    as published by the Free Software Foundation; either version 2
#    of the License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.    See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program; if not, write to the Free Software Foundation,
#    Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
#
# ##### END GPL LICENSE BLOCK #####

import os
import re
import time

import bpy
import mathutils
import bpy_extras.io_utils

def _getName( object ):
    return re.sub( '[^a-zA-Z0-9_]+', '', re.sub( '[\. ]','_', object.data.name ))

# output an object
def _write_mesh( fw, object, mesh, EXPORT_NORMALS ):
    objectName = _getName(object)

    if ( EXPORT_NORMALS ):
      print("exporting normals")
      bpy.ops.object.shade_smooth()
    else:
      print("not exporting normals")

    # if an object has geometry, export them
    if (len(mesh.polygons) + len(mesh.vertices)):
        # drop our geometry
        fw("{\"name\": \"%s\",\n" % objectName)
        fw("\"ibo\": [\n")
        for index, face in enumerate(mesh.polygons):
            face_verts = face.vertices
            if index != 0:
                fw(',')
            # fan triangulate
            for i in range(2, len(face_verts), 1):
                if i>2:
                    fw(",")
                fw("%d,%d,%d" % (face_verts[i],face_verts[i-1],face_verts[0]))
        fw("],\n")
        # our vbo stride
        fw("\"stride\": ")
        if ( EXPORT_NORMALS ):
          fw("6,")
        else:
          fw("3,")
        # drop our vert positions
        fw("\"vbo\": [")
        for vertex in mesh.vertices:
            if vertex.index != 0:
                fw(",")
            if ( EXPORT_NORMALS ):
                fw("\n%f,%f,%f,%f,%f,%f" % (vertex.co.x,vertex.co.y,vertex.co.z,vertex.normal.x,vertex.normal.y,vertex.normal.z))
            else:
                fw("\n%f,%f,%f" % (vertex.co.x,vertex.co.y,vertex.co.z))
        fw("]")

        bones, num_bones = generate_bones()
        fw("\n\"bones\": %s" % bones)

        weights = generate_weights(object, mesh)
        fw("\n\"indices\": %s" % weights)

        fw("}\n")
    else:
        print("ERROR: tried to export a mesh without sufficient verts!")


def _write(context, filepath, EXPORT_APPLY_MODIFIERS, EXPORT_NORMALS):

    time1 = time.time() # profile how long we take
    print("saving to file: %s" % filepath)
    file = open(filepath, "w", encoding="utf8", newline="\n")
    filename_prefix=re.sub(
            '[\. ]','_'
            ,os.path.splitext( os.path.basename( file.name ) )[0]
            )
    fw = file.write

    # get this [party] started
    fw("[\n")

    scene = context.scene
    # Exit edit mode before exporting, so current object states are exported properly.
    if bpy.ops.object.mode_set.poll():
        bpy.ops.object.mode_set(mode='OBJECT')
    for object in context.selected_objects:

        # EXPORT THE SHAPES.
        if object.type=='MESH':
            _write_mesh(fw, object, object.to_mesh(scene, EXPORT_APPLY_MODIFIERS, 'PREVIEW'), EXPORT_NORMALS )

    # we're done here
    fw("]")
    file.close()
    print("JSON Export time: %.2f" % (time.time() - time1))
 
def save(operator, context, filepath="",
                 apply_modifiers=True,
                 export_normals=True,
                 ):

    _write(context, filepath,
                 EXPORT_APPLY_MODIFIERS=apply_modifiers,
                 EXPORT_NORMALS=export_normals,
                 )

    return {'FINISHED'}

# export armature
# (only the first armature will exported)
def get_armature():
    if len(bpy.data.armatures) == 0:
        print("Warning: no armatures in the scene")
        return None, None

    armature = bpy.data.armatures[0]

    # Someone please figure out a proper way to get the armature node
    for object in bpy.data.objects:
        if object.type == 'ARMATURE':
            return armature, object

    print("Warning: no node of type 'ARMATURE' in the scene")
    return None, None

# export bones
# (only the first armature will exported)
def generate_bones():

    armature, armatureObject = get_armature()
    if armature is None or armatureObject is None:
        return "", 0

    hierarchy = []

    TEMPLATE_BONE = '{"parent":%d,"name":"%s","pos":[%g,%g,%g],"worldpos":[%g,%g,%g],"bonematrix":[0,0,0,1...]}\n'

    for bone in armature.bones:
        bonePos = None
        boneIndex = None
        if bone.parent is None:
            bonePos = bone.head_local
            boneIndex = -1
        else:
            bonePos = bone.head_local - bone.parent.head_local
            boneIndex = i = 0
            for parent in armature.bones:
                if parent.name == bone.parent.name:
                    boneIndex = i
                i += 1

        bonePosWorld = armatureObject.matrix_world * bonePos
        joint = TEMPLATE_BONE % (boneIndex, bone.name, bonePos.x, bonePos.y, bonePos.z, bonePosWorld.x, bonePosWorld.y, bonePosWorld.z)
        hierarchy.append(joint)
                
    bones_string = '['+",".join(hierarchy)+']'

    return bones_string, len(armature.bones)


# export weights
def generate_weights(object, mesh):

    weights_json = "["
    weights = []

    armature, armatureObject = get_armature()

    i = 0
    mesh_index = -1

    # find the original object

    for obj in bpy.data.objects:
        if obj.name == mesh.name or obj == object:
            mesh_index = i
        i += 1

    if mesh_index == -1:
        print("generate_indices: couldn't find object for mesh", mesh.name)
        return "", ""

    object = bpy.data.objects[mesh_index]

    for vertex in mesh.vertices:

        vertex_json = '{'

        bone_array = []
        indices = []
        vertex_weights = []

        for group in vertex.groups:
            index = group.group
            weight = group.weight

            bone_array.append( (index, weight) )

        for i in range(0, len(bone_array), 1):

            bone_proxy = bone_array[i]
            
            index = bone_proxy[0]
            weight = bone_proxy[1]


            for bone_index, bone in enumerate(armature.bones):

                if object.vertex_groups[index].name == bone.name:
                    vertex_weights.append('"%d":%g' % (bone_index, weight))
        vertex_json += (",".join(vertex_weights))
        vertex_json += '}\n'
        weights.append( vertex_json )

    weights_json += (",".join(weights))
    weights_json += "]"

    return weights_json
