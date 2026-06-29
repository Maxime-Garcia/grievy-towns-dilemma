using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class castRockPillar : MonoBehaviour
{
    public int damages;
    public float destroyTime;
    private Animator anim;
    private AudioSource audio;

    private void Start()
    {
      
        Destroy(gameObject, destroyTime);

//        audio.Play();
    }

    public void destroyProjectile()
    {
        Destroy(gameObject);
    }    
}
